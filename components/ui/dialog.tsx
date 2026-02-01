'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogContextValue {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(undefined)

function useDialog() {
    const context = React.useContext(DialogContext)
    if (!context) {
        throw new Error('Dialog components must be used within a Dialog')
    }
    return context
}

interface DialogProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
    children: React.ReactNode
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
    return (
        <DialogContext.Provider value={{ open, onOpenChange: onOpenChange ?? (() => { }) }}>
            {children}
        </DialogContext.Provider>
    )
}

interface DialogTriggerProps {
    asChild?: boolean
    children: React.ReactNode
}

function DialogTrigger({ asChild, children }: DialogTriggerProps) {
    const { onOpenChange } = useDialog()

    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
            onClick: () => onOpenChange(true),
        })
    }

    return (
        <button type="button" onClick={() => onOpenChange(true)}>
            {children}
        </button>
    )
}

interface DialogContentProps {
    children: React.ReactNode
    className?: string
}

function DialogContent({ children, className }: DialogContentProps) {
    const { open, onOpenChange } = useDialog()

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            {/* Content */}
            <div
                className={cn(
                    'relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl',
                    'animate-in fade-in-0 zoom-in-95',
                    className
                )}
            >
                <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar</span>
                </button>
                {children}
            </div>
        </div>
    )
}

interface DialogHeaderProps {
    children: React.ReactNode
    className?: string
}

function DialogHeader({ children, className }: DialogHeaderProps) {
    return (
        <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
            {children}
        </div>
    )
}

interface DialogFooterProps {
    children: React.ReactNode
    className?: string
}

function DialogFooter({ children, className }: DialogFooterProps) {
    return (
        <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
            {children}
        </div>
    )
}

interface DialogTitleProps {
    children: React.ReactNode
    className?: string
}

function DialogTitle({ children, className }: DialogTitleProps) {
    return (
        <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)}>
            {children}
        </h2>
    )
}

interface DialogDescriptionProps {
    children: React.ReactNode
    className?: string
}

function DialogDescription({ children, className }: DialogDescriptionProps) {
    return (
        <p className={cn('text-sm text-neutral-500', className)}>
            {children}
        </p>
    )
}

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
