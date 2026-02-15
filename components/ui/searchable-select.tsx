'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Option {
    value: string
    label: string
}

interface SearchableSelectProps {
    options: Option[]
    value?: string | null
    onChange: (value: string | null) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    className,
    disabled = false,
}: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = options.find((option) => option.value === value)

    // Filter options based on search
    const filteredOptions = React.useMemo(() => {
        if (!search) return options
        return options.filter((option) =>
            option.label.toLowerCase().includes(search.toLowerCase())
        )
    }, [options, search])

    // Handle click outside to close dropdown
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    return (
        <div className={cn('relative', className)} ref={containerRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setOpen(!open)
                        // Focus search input when opening
                        if (!open) {
                            setTimeout(() => {
                                const input = containerRef.current?.querySelector('input')
                                if (input) input.focus()
                            }, 0)
                        }
                    }
                }}
            >
                {selectedOption ? (
                    <span className="truncate mr-2">{selectedOption.label}</span>
                ) : (
                    <span className="text-muted-foreground mr-2">{placeholder}</span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                    {selectedOption && !disabled && (
                        <div
                            role="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(null)
                            }}
                            className="p-1 hover:bg-neutral-100 rounded-full"
                        >
                            <X className="h-3 w-3 opacity-50" />
                        </div>
                    )}
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </div>
            </Button>

            {open && (
                <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-md border border-neutral-200 bg-white shadow-md animate-in fade-in-80 zoom-in-95">
                    <div className="flex items-center border-b border-neutral-100 px-3">
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <p className="p-2 text-sm text-neutral-500 text-center">Nenhum resultado encontrado.</p>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-neutral-100 hover:text-neutral-900',
                                        value === option.value && 'bg-neutral-100 text-neutral-900'
                                    )}
                                    onClick={() => {
                                        onChange(option.value)
                                        setOpen(false)
                                        setSearch('')
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === option.value ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    <span className="truncate">{option.label}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
