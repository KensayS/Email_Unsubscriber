/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimeframeSelect } from '@/components/timeframe-select'

describe('TimeframeSelect', () => {
  it('renders with default value label', () => {
    render(<TimeframeSelect value={1} onChange={jest.fn()} />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('calls onChange when a new option is selected', async () => {
    const onChange = jest.fn()
    render(<TimeframeSelect value={1} onChange={onChange} />)
    const select = screen.getByRole('combobox')
    await userEvent.click(select)
    const option = await screen.findByText('1 month')
    await userEvent.click(option)
    expect(onChange).toHaveBeenCalledWith(1)
  })
})
