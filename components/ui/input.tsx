import * as React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, Search, Check } from 'lucide-react'
import { Button } from './button'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean | string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'w-full px-4 py-3 text-sm font-inter text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl transition-all duration-250 outline-none',
          'placeholder:text-neutral-400',
          'hover:border-neutral-300',
          'focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10',
          'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-70',
          Boolean(error) && 'border-error focus:border-error focus:ring-error/10',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export interface InputWithIconProps extends InputProps {
  icon: React.ComponentType<{ className?: string }>
  iconPosition?: 'left' | 'right'
}

export const InputWithIcon = React.forwardRef<HTMLInputElement, InputWithIconProps>(
  ({ className, icon: Icon, iconPosition = 'left', ...props }, ref) => {
    return (
      <div className="relative">
        <Icon
          className={cn(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 pointer-events-none',
            iconPosition === 'left' ? 'left-4' : 'right-4'
          )}
        />
        <Input
          ref={ref}
          className={cn(
            iconPosition === 'left' ? 'pl-10' : 'pr-10',
            className
          )}
          {...props}
        />
      </div>
    )
  }
)
InputWithIcon.displayName = 'InputWithIcon'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean | string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full px-4 py-3 text-sm font-inter text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-xl transition-all duration-250 outline-none',
          'placeholder:text-neutral-400',
          'hover:border-neutral-300',
          'focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/10',
          'disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-70',
          'resize-vertical min-h-[100px] leading-relaxed',
          Boolean(error) && 'border-error focus:border-error focus:ring-error/10',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('text-sm font-medium text-neutral-600 font-inter', className)}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-1">*</span>}
      </label>
    )
  }
)
Label.displayName = 'Label'

export interface FormFieldProps {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  error,
  helperText,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {error && (
        <p className="text-xs text-error-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {!error && helperText && (
        <p className="text-xs text-neutral-500 mt-1">{helperText}</p>
      )}
    </div>
  )
}

export interface SearchInputProps {
  onSearch?: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ onSearch, placeholder, className }: SearchInputProps) {
  const [value, setValue] = React.useState('')

  const handleSearch = () => {
    if (onSearch) {
      onSearch(value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-3',
        className
      )}
    >
      <Search className="w-5 h-5 text-neutral-600 flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Buscar...'}
        className="flex-1 py-2 text-sm bg-transparent border-none outline-none placeholder:text-neutral-400"
      />
      <Button onClick={handleSearch} size="sm">
        Buscar
      </Button>
    </div>
  )
}

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input type="checkbox" className="peer hidden" ref={ref} {...props} />
        <span className="w-[1.125rem] h-[1.125rem] border-2 border-neutral-300 rounded transition-all peer-checked:bg-primary peer-checked:border-primary peer-hover:border-primary flex items-center justify-center flex-shrink-0">
          <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
        </span>
        {label && <span className="text-sm text-neutral-700 font-inter">{label}</span>}
      </label>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input type="radio" className="peer hidden" ref={ref} {...props} />
        <span className="relative w-[1.125rem] h-[1.125rem] border-2 border-neutral-300 rounded-full transition-all peer-checked:border-primary peer-hover:border-primary flex items-center justify-center flex-shrink-0">
          <span className="w-2 h-2 bg-primary rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
        </span>
        {label && <span className="text-sm text-neutral-700 font-inter">{label}</span>}
      </label>
    )
  }
)
Radio.displayName = 'Radio'

export interface RadioGroupProps {
  options: Array<{ value: string; label: string }>
  value?: string
  onChange?: (value: string) => void
  name: string
  className?: string
}

export function RadioGroup({ options, value, onChange, name, className }: RadioGroupProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      {options.map((option) => (
        <label key={option.value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange?.(e.target.value)}
            className="peer hidden"
          />
          <span className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-700 peer-checked:border-amber-400 peer-checked:bg-amber-50 font-geist transition-all">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  )
}
