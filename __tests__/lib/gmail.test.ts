import { parseSenderHeader, extractUnsubscribeUrl, extractMailtoAddress } from '@/lib/gmail'

describe('parseSenderHeader', () => {
  it('extracts email and name from "Name <email>" format', () => {
    const result = parseSenderHeader('Nike <news@nike.com>')
    expect(result).toEqual({ name: 'Nike', email: 'news@nike.com' })
  })

  it('extracts email from bare email format', () => {
    const result = parseSenderHeader('news@nike.com')
    expect(result).toEqual({ name: 'news@nike.com', email: 'news@nike.com' })
  })

  it('strips surrounding quotes from name', () => {
    const result = parseSenderHeader('"Nike News" <news@nike.com>')
    expect(result).toEqual({ name: 'Nike News', email: 'news@nike.com' })
  })

  it('returns empty strings for empty input', () => {
    const result = parseSenderHeader('')
    expect(result).toEqual({ name: '', email: '' })
  })
})

describe('extractUnsubscribeUrl', () => {
  it('extracts HTTPS URL from List-Unsubscribe header', () => {
    const header = '<https://example.com/unsub?id=123>, <mailto:unsub@example.com>'
    expect(extractUnsubscribeUrl(header)).toBe('https://example.com/unsub?id=123')
  })

  it('returns null when no URL present', () => {
    expect(extractUnsubscribeUrl('<mailto:unsub@example.com>')).toBeNull()
  })

  it('returns null for undefined header', () => {
    expect(extractUnsubscribeUrl(undefined)).toBeNull()
  })
})

describe('extractMailtoAddress', () => {
  it('extracts mailto address from List-Unsubscribe header', () => {
    const header = '<https://example.com/unsub>, <mailto:unsub@example.com?subject=unsubscribe>'
    expect(extractMailtoAddress(header)).toBe('unsub@example.com?subject=unsubscribe')
  })

  it('returns null when no mailto present', () => {
    expect(extractMailtoAddress('<https://example.com/unsub>')).toBeNull()
  })

  it('returns null for undefined header', () => {
    expect(extractMailtoAddress(undefined)).toBeNull()
  })
})
