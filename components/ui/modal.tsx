'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from './button'

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen'
  children: React.ReactNode
  className?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  animation?: 'zoom' | 'fade-up'
  mobileSheet?: boolean
}

export function Modal({
  open,
  onOpenChange,
  size = 'md',
  children,
  className,
  ariaLabelledBy,
  ariaDescribedBy,
  animation = 'zoom',
  mobileSheet = false,
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Body scroll lock
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // Focus trap and focus management
  React.useEffect(() => {
    if (!open || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const focusableArray = Array.from(focusableElements)
    const firstFocusable = focusableArray[0]
    const lastFocusable = focusableArray[focusableArray.length - 1]

    // Focus first element or container
    if (firstFocusable) {
      firstFocusable.focus()
    } else {
      container.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (focusableArray.length === 0) {
        e.preventDefault()
        return
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // Escape key handler
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, onOpenChange])

  // Client-side only mounting
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !open) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    fullscreen: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] h-[calc(100vh-2rem)]',
  }

  const maxHeightClass = size === 'fullscreen' ? '' : 'max-h-[90vh]'

  const containerClasses = mobileSheet
    ? 'fixed inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center z-[9999]'
    : 'fixed inset-0 z-[9999] flex items-center justify-center p-4'

  const cardClasses = mobileSheet
    ? 'rounded-t-2xl sm:rounded-2xl'
    : 'rounded-2xl'

  const animationClasses = animation === 'fade-up'
    ? cn(
        'transition-all duration-300 ease-out',
        open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )
    : cn(
        'transition-all duration-250 ease-out',
        open ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      )

  const modalContent = (
    <div className={containerClasses}>
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={containerRef}
        className={cn(
          'relative bg-white shadow-custom-xl w-full flex flex-col overflow-hidden',
          cardClasses,
          animationClasses,
          sizeClasses[size],
          maxHeightClass,
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export interface ModalHeaderProps {
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

export function ModalHeader({ children, onClose, className }: ModalHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-6 border-b border-neutral-200',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-transparent border-none text-neutral-500 cursor-pointer transition-all hover:bg-neutral-100 hover:text-neutral-900 flex-shrink-0 ml-4"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

export interface ModalTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export function ModalTitle({ className, children, ...props }: ModalTitleProps) {
  return (
    <h2
      className={cn('text-lg font-semibold text-neutral-900 font-geist', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export interface ModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ModalBody({ className, children, ...props }: ModalBodyProps) {
  return (
    <div
      className={cn(
        'flex-1 p-6 overflow-y-auto text-sm text-neutral-700 font-inter',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  centered?: boolean
}

export function ModalFooter({ className, centered, children, ...props }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-6 border-t border-neutral-200',
        centered ? 'justify-center' : 'justify-end',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function ModalOverlay({ onClick }: { onClick?: () => void }) {
  return (
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    />
  )
}

export interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export function AlertDialog({
  open,
  onOpenChange,
  type,
  title,
  description,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
}: AlertDialogProps) {
  const iconConfig = {
    success: {
      icon: CheckCircle2,
      className: 'bg-success/10 text-success',
    },
    error: {
      icon: XCircle,
      className: 'bg-error/10 text-error',
    },
    warning: {
      icon: AlertTriangle,
      className: 'bg-warning/10 text-warning',
    },
    info: {
      icon: Info,
      className: 'bg-info/10 text-info',
    },
  }

  const config = iconConfig[type]
  const Icon = config.icon

  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <ModalBody className="text-center pt-6">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
            config.className
          )}
        >
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 font-geist mb-2">{title}</h3>
        <p className="text-sm text-neutral-600">{description}</p>
      </ModalBody>
      <ModalFooter centered>
        {cancelText && (
          <Button variant="secondary" onClick={handleCancel}>
            {cancelText}
          </Button>
        )}
        <Button onClick={handleConfirm}>{confirmText}</Button>
      </ModalFooter>
    </Modal>
  )
}

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  onConfirm?: () => void
  onCancel?: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <ModalBody className="text-center pt-6">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-warning/10 text-warning">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 font-geist mb-2">{title}</h3>
        <p className="text-sm text-neutral-600">{description}</p>
      </ModalBody>
      <ModalFooter centered>
        <Button variant="secondary" onClick={handleCancel}>
          {cancelText}
        </Button>
        <Button variant={destructive ? 'destructive' : 'primary'} onClick={handleConfirm}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
