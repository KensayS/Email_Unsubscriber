'use client'

import { ViewMode } from '@/types'
import { Button } from '@/components/ui/button'
import { LayoutGrid, List } from 'lucide-react'

const MODES: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'grid', label: 'Grid', icon: <LayoutGrid size={16} /> },
  { value: 'list', label: 'List', icon: <List size={16} /> },
]

interface Props {
  value: ViewMode
  onChange: (value: ViewMode) => void
  disabled?: boolean
}

export function ViewModeSelect({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-1 rounded-full bg-[#f5f0ff] dark:bg-[#2d1b4e] p-1 border border-[rgba(38,17,74,0.12)] dark:border-[rgba(167,139,250,0.15)] transition-colors duration-300">
      {MODES.map((mode) => (
        <Button
          key={mode.value}
          size="sm"
          variant={value === mode.value ? 'default' : 'ghost'}
          onClick={() => onChange(mode.value)}
          disabled={disabled}
          className={`flex gap-1.5 h-8 px-3 rounded-full transition-all duration-200 ${
            value === mode.value
              ? 'bg-[#26114a] text-white'
              : 'text-[#9491a1] dark:text-[#b8a7d6] hover:text-[#26114a] dark:hover:text-[#c084fc]'
          }`}
          title={mode.label}
        >
          {mode.icon}
          <span className="hidden sm:inline text-xs font-medium">{mode.label}</span>
        </Button>
      ))}
    </div>
  )
}
