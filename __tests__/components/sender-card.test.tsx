/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SenderCard } from '@/components/sender-card'
import { SenderInfo } from '@/types'

const mockSender: SenderInfo = {
  name: 'Nike',
  email: 'news@nike.com',
  count: 42,
  subjects: ['Sale: 50% off', 'New arrivals'],
  listUnsubscribe: '<https://nike.com/unsub>',
  listUnsubscribePost: 'List-Unsubscribe=One-Click',
}

describe('SenderCard', () => {
  it('renders sender name and email', () => {
    render(<SenderCard sender={mockSender} />)
    expect(screen.getByText('Nike')).toBeInTheDocument()
    expect(screen.getByText('news@nike.com')).toBeInTheDocument()
  })

  it('renders email count badge', () => {
    render(<SenderCard sender={mockSender} />)
    expect(screen.getByText('42 emails')).toBeInTheDocument()
  })

  it('shows subject snippet from sender subjects', () => {
    render(<SenderCard sender={mockSender} />)
    expect(screen.getByText('Sale: 50% off · New arrivals')).toBeInTheDocument()
  })

  it('shows domain fallback when subjects is empty', () => {
    render(<SenderCard sender={{ ...mockSender, subjects: [] }} />)
    expect(screen.getByText('nike.com')).toBeInTheDocument()
  })

  it('renders Unsubscribe button in idle state', () => {
    render(<SenderCard sender={mockSender} />)
    expect(screen.getByRole('button', { name: /unsubscribe/i })).toBeInTheDocument()
  })

  it('calls onUnsubscribe when button is clicked', async () => {
    const onUnsubscribe = jest.fn().mockResolvedValue({ status: 'unsubscribed' })
    render(<SenderCard sender={mockSender} onUnsubscribe={onUnsubscribe} />)
    await userEvent.click(screen.getByRole('button', { name: /unsubscribe/i }))
    expect(onUnsubscribe).toHaveBeenCalledWith(mockSender)
  })

  it('shows checkmark after successful unsubscribe', async () => {
    const onUnsubscribe = jest.fn().mockResolvedValue({ status: 'unsubscribed' })
    render(<SenderCard sender={mockSender} onUnsubscribe={onUnsubscribe} />)
    await userEvent.click(screen.getByRole('button', { name: /unsubscribe/i }))
    await waitFor(() => {
      expect(screen.getByText(/unsubscribed/i)).toBeInTheDocument()
    })
  })

  it('shows "No unsubscribe found" when status is not_found', async () => {
    const onUnsubscribe = jest.fn().mockResolvedValue({ status: 'not_found' })
    render(<SenderCard sender={mockSender} onUnsubscribe={onUnsubscribe} />)
    await userEvent.click(screen.getByRole('button', { name: /unsubscribe/i }))
    await waitFor(() => {
      expect(screen.getByText(/no unsubscribe found/i)).toBeInTheDocument()
    })
  })
})
