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
    <div className="flex gap-1 rounded-full bg-[#f5f5f5] dark:bg-[#2d2d2d] p-1 border border-[rgba(0,0,0,0.08)] dark:border-[rgba(255,255,255,0.1)] transition-colors duration-300">
      {MODES.map((mode) => (
        <Button
          key={mode.value}
          size="sm"
          variant={value === mode.value ? 'default' : 'ghost'}
          onClick={() => onChange(mode.value)}
          disabled={disabled}
          className={`flex gap-1.5 h-8 px-3 rounded-full transition-all duration-200 ${
            value === mode.value
              ? 'bg-[#1a1a1a] text-white dark:bg-[#d4d4d4] dark:text-[#0f0f0f]'
              : 'text-[#737373] dark:text-[#a3a3a3] hover:text-[#1a1a1a] dark:hover:text-[#e5e5e5]'
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
