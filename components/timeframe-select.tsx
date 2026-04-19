'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Timeframe } from '@/types'

const OPTIONS: { value: Timeframe; label: string }[] = [
  { value: 1, label: '1 month' },
  { value: 3, label: '3 months' },
  { value: 6, label: '6 months' },
  { value: 12, label: '1 year' },
  { value: 24, label: '2 years' },
]

interface Props {
  value: Timeframe
  onChange: (value: Timeframe) => void
  disabled?: boolean
}

export function TimeframeSelect({ value, onChange, disabled }: Props) {
  return (
    <Select
      value={String(value)}
      onValueChange={(v) => onChange(Number(v) as Timeframe)}
      disabled={disabled}
    >
      <SelectTrigger className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={String(opt.value)}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
