'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills'
  children: React.ReactNode
  className?: string
}

export interface TabsTriggerProps {
  value: string
  disabled?: boolean
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}

export interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
  orientation: 'horizontal' | 'vertical'
  variant: 'default' | 'pills'
  idPrefix: string
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component')
  }
  return context
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = 'horizontal',
  variant = 'default',
  children,
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')
  const idPrefix = React.useId()

  const activeTab = controlledValue !== undefined ? controlledValue : internalValue

  const setActiveTab = React.useCallback(
    (newValue: string) => {
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    },
    [controlledValue, onValueChange]
  )

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, orientation, variant, idPrefix }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { orientation, variant } = useTabsContext()
  const triggersRef = React.useRef<(HTMLButtonElement | null)[]>([])

  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    const triggers = triggersRef.current.filter(Boolean) as HTMLButtonElement[]
    let nextIndex = currentIndex

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        nextIndex = currentIndex + 1 >= triggers.length ? 0 : currentIndex + 1
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        nextIndex = currentIndex - 1 < 0 ? triggers.length - 1 : currentIndex - 1
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = triggers.length - 1
        break
      default:
        return
    }

    triggers[nextIndex]?.focus()
  }

  const baseClasses = variant === 'pills'
    ? 'flex items-center bg-neutral-100 p-1 rounded-xl gap-0'
    : orientation === 'vertical'
    ? 'flex flex-col items-start border-r border-neutral-200 pr-4 min-w-[10rem]'
    : 'flex items-center border-b border-neutral-200 mb-6 gap-1'

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={cn(baseClasses, 'overflow-x-auto no-scrollbar md:overflow-visible', className)}
      onKeyDown={(e) => {
        const target = e.target as HTMLElement
        const currentIndex = triggersRef.current.indexOf(target as HTMLButtonElement)
        if (currentIndex !== -1) {
          handleKeyDown(e, currentIndex)
        }
      }}
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            ref: (el: HTMLButtonElement) => {
              triggersRef.current[index] = el
            },
          } as any)
        }
        return child
      })}
    </div>
  )
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, disabled, icon: Icon, children, className }, ref) => {
    const { activeTab, setActiveTab, orientation, variant, idPrefix } = useTabsContext()
    const isActive = activeTab === value
    const tabId = `${idPrefix}-tab-${value}`
    const panelId = `${idPrefix}-panel-${value}`

    const baseClasses =
      'inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium font-inter bg-transparent border-none cursor-pointer transition-all duration-200 whitespace-nowrap outline-none'

    const variantClasses = {
      default: {
        inactive:
          orientation === 'vertical'
            ? 'w-full justify-start border-l-2 border-transparent -ml-px pl-4 text-neutral-500 hover:text-neutral-700'
            : 'text-neutral-500 border-b-2 border-transparent -mb-px hover:text-neutral-700',
        active:
          orientation === 'vertical'
            ? 'w-full justify-start text-primary border-l-2 border-primary -ml-px bg-primary/5'
            : 'text-primary border-b-2 border-primary -mb-px',
      },
      pills: {
        inactive: 'text-neutral-600 rounded-lg hover:bg-neutral-200',
        active: 'text-primary bg-white shadow-sm',
      },
    }

    return (
      <button
        ref={ref}
        id={tabId}
        role="tab"
        aria-selected={isActive}
        aria-controls={panelId}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => setActiveTab(value)}
        className={cn(
          baseClasses,
          isActive ? variantClasses[variant].active : variantClasses[variant].inactive,
          'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { activeTab, idPrefix } = useTabsContext()
  const isActive = activeTab === value
  const tabId = `${idPrefix}-tab-${value}`
  const panelId = `${idPrefix}-panel-${value}`

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
      tabIndex={0}
      className={cn(isActive ? 'block animate-fade-in-up' : 'hidden', className)}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}
