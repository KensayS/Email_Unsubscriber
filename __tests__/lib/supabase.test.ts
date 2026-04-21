// Set up environment variables before importing the module
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-publishable-key'

// Mock the supabase client before importing our module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn((tableName: string) => {
      if (tableName === 'user_unsubscribes') {
        return {
          select: jest.fn(function (this: any) {
            return this
          }),
          eq: jest.fn(function (this: any) {
            return this
          }),
          order: jest.fn(function (this: any) {
            return this
          }),
          insert: jest.fn(function (this: any) {
            return this
          }),
        }
      }
      return {}
    }),
  })),
}))

import {
  fetchUserUnsubscribes,
  fetchUserUnsubscribesList,
  logUnsubscribe,
  type UnsubscribedRecord,
} from '@/lib/supabase'

describe('Supabase Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('fetchUserUnsubscribes', () => {
    it('returns a Set of sender emails', async () => {
      const mockData = [
        { sender_email: 'newsletter@example.com' },
        { sender_email: 'promo@shop.com' },
      ]

      // Mock the supabase client's chain
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      })

      const result = await fetchUserUnsubscribes('test-user-id')

      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(2)
      expect(result.has('newsletter@example.com')).toBe(true)
      expect(result.has('promo@shop.com')).toBe(true)
    })

    it('returns empty Set on error', async () => {
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
        }),
      })

      const result = await fetchUserUnsubscribes('test-user-id')

      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(0)
    })

    it('returns empty Set on unexpected error', async () => {
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const result = await fetchUserUnsubscribes('test-user-id')

      expect(result).toBeInstanceOf(Set)
      expect(result.size).toBe(0)
    })
  })

  describe('fetchUserUnsubscribesList', () => {
    it('returns an array of UnsubscribedRecord objects', async () => {
      const mockData: UnsubscribedRecord[] = [
        {
          id: '1',
          google_user_id: 'test-user-id',
          sender_email: 'newsletter@example.com',
          sender_name: 'Example Newsletter',
          unsubscribed_at: '2024-04-20T10:00:00Z',
          created_at: '2024-04-20T10:00:00Z',
        },
        {
          id: '2',
          google_user_id: 'test-user-id',
          sender_email: 'promo@shop.com',
          sender_name: 'Shop Promo',
          unsubscribed_at: '2024-04-19T15:30:00Z',
          created_at: '2024-04-19T15:30:00Z',
        },
      ]

      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      })

      const result = await fetchUserUnsubscribesList('test-user-id')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(2)
      expect(result[0].sender_email).toBe('newsletter@example.com')
      expect(result[0].sender_name).toBe('Example Newsletter')
    })

    it('returns empty array on error', async () => {
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
          }),
        }),
      })

      const result = await fetchUserUnsubscribesList('test-user-id')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })

    it('returns empty array on unexpected error', async () => {
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const result = await fetchUserUnsubscribesList('test-user-id')

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBe(0)
    })
  })

  describe('logUnsubscribe', () => {
    it('returns true on successful unsubscribe log', async () => {
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null }),
      })

      const result = await logUnsubscribe(
        'test-user-id',
        'test@example.com',
        'Test Sender',
        new Date().toISOString()
      )

      expect(typeof result).toBe('boolean')
      expect(result).toBe(true)
    })

    it('returns false on database error', async () => {
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: new Error('Insert failed') }),
      })

      const result = await logUnsubscribe(
        'test-user-id',
        'test@example.com',
        'Test Sender',
        new Date().toISOString()
      )

      expect(typeof result).toBe('boolean')
      expect(result).toBe(false)
    })

    it('returns false on unexpected error', async () => {
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const result = await logUnsubscribe(
        'test-user-id',
        'test@example.com',
        'Test Sender',
        new Date().toISOString()
      )

      expect(typeof result).toBe('boolean')
      expect(result).toBe(false)
    })

    it('inserts correct data into user_unsubscribes table', async () => {
      const mockInsert = jest.fn().mockResolvedValue({ error: null })
      const { supabase } = require('@/lib/supabase')
      const mockFrom = jest.spyOn(supabase, 'from')
      mockFrom.mockReturnValue({
        insert: mockInsert,
      })

      const testDate = '2024-04-20T12:00:00Z'
      await logUnsubscribe('test-user-id', 'test@example.com', 'Test Sender', testDate)

      expect(mockInsert).toHaveBeenCalledWith([
        {
          google_user_id: 'test-user-id',
          sender_email: 'test@example.com',
          sender_name: 'Test Sender',
          unsubscribed_at: testDate,
        },
      ])
    })
  })
})
