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
    <div className="flex gap-1 rounded-md border bg-muted/50 p-1">
      {MODES.map((mode) => (
        <Button
          key={mode.value}
          size="sm"
          variant={value === mode.value ? 'default' : 'ghost'}
          onClick={() => onChange(mode.value)}
          disabled={disabled}
          className="flex gap-1.5 h-8 px-2.5"
          title={mode.label}
        >
          {mode.icon}
          <span className="hidden sm:inline text-xs font-medium">{mode.label}</span>
        </Button>
      ))}
    </div>
  )
}
