import * as React from 'react'
import { cn, formatCurrency } from '@/lib/utils'
import { Button } from './button'
import { StatusBadge } from './badge'
import { MapPin, Calendar, Clock, Users, DollarSign, Check, Wifi, Trophy, Presentation, Dumbbell, Activity, Bike, Waves, TreePine, Volleyball } from 'lucide-react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> { }

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white border border-neutral-200 rounded-2xl transition-all duration-300 hover:shadow-custom-md hover:border-neutral-300',
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 border-b border-neutral-200', className)}
        {...props}
      />
    )
  }
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-neutral-900 font-geist', className)}
      {...props}
    />
  )
})
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p ref={ref} className={cn('text-sm text-neutral-500 mt-1', className)} {...props} />
  )
})
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 text-sm text-neutral-600', className)} {...props} />
    )
  }
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-6 border-t border-neutral-200', className)}
        {...props}
      />
    )
  }
)
CardFooter.displayName = 'CardFooter'

export interface EventCardProps {
  variant: 'grid' | 'list' | 'compact'
  image: string
  title: string
  location: string
  category: string
  date: string
  price?: number
  tags?: string[]
  description?: string
  badge?: {
    text: string
    variant: 'warning' | 'error' | 'success' | 'info'
  }
  isSoldOut?: boolean
  isVirtual?: boolean
  participants?: number
  time?: string
  onRegister?: () => void
  className?: string
  featured?: boolean
}

export function EventCard({
  variant,
  image,
  title,
  location,
  category,
  date,
  price,
  tags,
  description,
  badge,
  isSoldOut,
  isVirtual,
  participants,
  time,
  onRegister,
  className,
  featured = false,
}: EventCardProps) {
  const badgeVariantClasses = {
    warning: 'bg-amber-500/90 border-amber-400 text-white',
    error: 'bg-red-500/90 border-red-400 text-white',
    success: 'bg-green-500/90 border-green-400 text-white',
    info: 'bg-purple-500/90 border-purple-400 text-white',
  }
  // Compact variant - minimal horizontal layout
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'overflow-hidden transition-all hover:bg-neutral-50 hover:shadow-custom-sm hover:border-neutral-300',
          isSoldOut && 'opacity-70',
          className
        )}
      >
        <div className="flex gap-3 p-3">
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-neutral-900 font-geist mb-1 truncate">
              {title}
            </h4>
            <p className="text-xs text-neutral-500 flex items-center gap-1 mb-1 truncate">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {date}
              {time && <><span className="text-neutral-300">•</span> <Clock className="w-3 h-3 flex-shrink-0" /> {time}</>}
            </p>
            <p className="text-xs text-neutral-500 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              {location}
            </p>
          </div>
          {price !== undefined && (
            <div className="flex-shrink-0 flex items-center">
              <span className="text-sm font-semibold text-primary">
                R$ {price.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </Card>
    )
  }

  if (variant === 'grid') {
    return (
      <Card
        className={cn(
          'group transition-all hover:-translate-y-0.5 border flex flex-col h-full overflow-hidden',
          featured
            ? 'bg-white/80 backdrop-blur border-neutral-200/60 hover:bg-white/90 hover:border-neutral-300/80 hover:shadow-[0_25px_60px_rgba(15,23,42,0.18)]'
            : 'bg-white border-neutral-100 hover:border-neutral-200 hover:shadow-custom-md',
          isSoldOut && 'opacity-70',
          className
        )}
      >
        <div className="relative h-56 overflow-hidden rounded-t-2xl flex-shrink-0">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          <div className="absolute top-4 left-4 flex flex-wrap gap-2 max-w-[75%]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/30 backdrop-blur px-3 py-1 text-xs font-medium text-white">
              {(() => {
                const lower = category.toLowerCase()
                // Esportes específicos
                if (lower.includes('corrida')) return <Trophy className="w-3 h-3" />
                if (lower.includes('ciclismo') || lower.includes('bike')) return <Bike className="w-3 h-3" />
                if (lower.includes('natação') || lower.includes('natacao')) return <Waves className="w-3 h-3" />
                if (lower.includes('trail')) return <TreePine className="w-3 h-3" />
                if (lower.includes('vôlei') || lower.includes('volei') || lower.includes('futevôlei') || lower.includes('futevolei')) return <Volleyball className="w-3 h-3" />
                if (lower.includes('beach') || lower.includes('praia') || lower.includes('paddle')) return <Waves className="w-3 h-3" />
                if (lower.includes('crossfit') || lower.includes('treino')) return <Dumbbell className="w-3 h-3" />
                if (lower.includes('triatlo') || lower.includes('triathlon')) return <Activity className="w-3 h-3" />
                // Formatos de evento
                if (lower.includes('workshop') || lower.includes('curso')) return <Presentation className="w-3 h-3" />
                if (lower.includes('competição') || lower.includes('competicao') || lower.includes('campeonato')) return <Trophy className="w-3 h-3" />
                // Default
                return <Activity className="w-3 h-3" />
              })()}
              {category}
            </span>

            {badge && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full backdrop-blur border px-2.5 py-1 text-xs font-geist',
                  badgeVariantClasses[badge.variant]
                )}
              >
                {badge.text}
              </span>
            )}

            {isVirtual && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/90 backdrop-blur px-3 py-1 text-xs font-medium text-white">
                <Wifi className="w-3 h-3" />
                Virtual
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center rounded-full bg-neutral-900/30 backdrop-blur px-3 py-1 text-xs font-medium text-white">
              {date}
            </span>
          </div>
        </div>

        <CardContent className="p-6 flex flex-col flex-1">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-neutral-900 font-geist mb-2 line-clamp-1">
              {title}
            </h3>

            <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>

            {description && (
              <p className="text-sm text-neutral-600 font-light mb-4 line-clamp-3">
                {description}
              </p>
            )}
          </div>

          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4 text-xs text-neutral-500 font-light">
              <div className="flex items-center gap-1.5">
                {time ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>{time}</span>
                  </>
                ) : (
                  <span>
                    {price !== undefined && price > 0 ? `a partir de ${formatCurrency(price)}` : 'Gratuito'}
                  </span>
                )}
              </div>

              <div className="text-right">
                {time ? (
                  <span className="text-neutral-900">
                    {price !== undefined && price > 0 ? formatCurrency(price) : 'Gratuito'}
                  </span>
                ) : (
                  <span>{isVirtual ? 'Virtual' : 'Presencial'}</span>
                )}
              </div>
            </div>

            {onRegister && (
              <button
                type="button"
                onClick={onRegister}
                disabled={isSoldOut}
                className={cn(
                  'inline-flex w-full items-center justify-center rounded-full px-5 py-2 text-sm font-semibold font-geist text-white shadow-[0_15px_35px_rgba(249,115,22,0.35)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-400',
                  'bg-gradient-to-r from-orange-400 to-orange-500',
                  isSoldOut && 'opacity-60 cursor-not-allowed'
                )}
              >
                {isSoldOut ? 'Esgotado' : 'Ver detalhes'}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // List variant
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all hover:bg-neutral-50 hover:shadow-custom-md hover:border-neutral-300',
        isSoldOut && 'opacity-70',
        className
      )}
    >
      <div className="flex flex-col md:flex-row">
        <div className="relative h-48 md:w-64 flex-shrink-0">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <span className="absolute top-4 left-4 inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-white/90 backdrop-blur-sm text-neutral-700 rounded-full font-medium">
            {category}
            {isVirtual && (
              <>
                <span className="text-neutral-300">•</span>
                <Wifi className="w-3 h-3" />
                Virtual
              </>
            )}
          </span>
          {price !== undefined && (
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white/90 backdrop-blur-sm text-neutral-900 rounded-full font-semibold">
              R$ {price.toFixed(2)}
            </span>
          )}
        </div>
        <CardContent className="flex-1 p-6">
          <h3 className="text-xl font-semibold text-neutral-900 font-geist mb-2">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-neutral-600 mb-4">{description}</p>
          )}
          <div className="flex flex-wrap gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-sm text-neutral-500">
              <MapPin className="w-4 h-4" />
              {location}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-neutral-500">
              <Calendar className="w-4 h-4" />
              {date}
            </span>
            {time && (
              <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                <Clock className="w-4 h-4" />
                {time}
              </span>
            )}
            {participants !== undefined && (
              <span className="flex items-center gap-1.5 text-sm text-neutral-500">
                <Users className="w-4 h-4" />
                {participants} participantes
              </span>
            )}
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          {onRegister && (
            <Button onClick={onRegister} size="sm" disabled={isSoldOut}>
              {isSoldOut ? 'Esgotado' : 'Ver detalhes'}
            </Button>
          )}
        </CardContent>
      </div>
    </Card>
  )
}

export interface InfoCardProps {
  variant?: 'default' | 'gradient' | 'bordered' | 'compact' | 'stat' | 'list'
  icon?: React.ReactNode
  label: string
  value: string
  title?: string
  description?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function InfoCard({ variant = 'default', icon, label, value, title, description, trend, className }: InfoCardProps) {
  // List variant - checkmark with title and description
  if (variant === 'list') {
    const displayTitle = title || label
    const displayDescription = description || value

    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium font-geist text-neutral-900">{displayTitle}</p>
          <p className="text-xs text-neutral-600 font-geist">{displayDescription}</p>
        </div>
      </div>
    )
  }

  // Stat variant - for analytics/dashboard
  if (variant === 'stat') {
    return (
      <Card
        className={cn(
          'p-6 transition-all hover:border-neutral-300 hover:shadow-custom-md',
          className
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center text-white flex-shrink-0">
            {icon}
          </div>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-1 rounded-full',
                trend.isPositive
                  ? 'bg-success/10 text-success-700'
                  : 'bg-error/10 text-error-700'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-neutral-900 font-geist">{value}</p>
      </Card>
    )
  }

  // Compact variant - minimal padding
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'p-3 transition-all hover:border-neutral-300 hover:shadow-custom-sm',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600 flex-shrink-0 text-sm">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-neutral-500 truncate">{label}</p>
            <p className="text-sm font-medium text-neutral-900 font-geist truncate">{value}</p>
          </div>
        </div>
      </Card>
    )
  }

  // Bordered variant - emphasized border
  if (variant === 'bordered') {
    return (
      <Card
        className={cn(
          'p-4 border-2 transition-all hover:border-primary hover:shadow-custom-sm',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="text-base font-semibold text-neutral-900 font-geist">{value}</p>
          </div>
        </div>
      </Card>
    )
  }

  // Gradient variant - with gradient background
  if (variant === 'gradient') {
    return (
      <Card
        className={cn(
          'p-4 bg-gradient-primary border-transparent transition-all hover:shadow-custom-md',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1">
            <p className="text-sm text-white/80">{label}</p>
            <p className="text-base font-semibold text-white font-geist">{value}</p>
          </div>
        </div>
      </Card>
    )
  }

  // Default variant
  return (
    <Card
      className={cn(
        'p-4 transition-all hover:border-neutral-300 hover:shadow-custom-sm',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-600 flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-base font-medium text-neutral-900 font-geist">{value}</p>
        </div>
      </div>
    </Card>
  )
}

export interface StatusCardProps {
  status: 'success' | 'warning' | 'error'
  icon: React.ReactNode
  title: string
  description: string
  statusBadge?: React.ReactNode
  footerData?: Array<{ label: string; value: string }>
  className?: string
}

export function StatusCard({
  status,
  icon,
  title,
  description,
  statusBadge,
  footerData,
  className,
}: StatusCardProps) {
  const statusConfig = {
    success: 'bg-success/10 text-success-600',
    warning: 'bg-warning/10 text-warning-600',
    error: 'bg-error/10 text-error-600',
  }

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start gap-4 mb-4">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            statusConfig[status]
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 font-geist mb-1">
            {title}
          </h3>
          <p className="text-sm text-neutral-600 mb-3">{description}</p>
          {statusBadge}
        </div>
      </div>
      {footerData && footerData.length > 0 && (
        <>
          <div className="h-px bg-neutral-200 my-4" />
          <div className="grid grid-cols-2 gap-4">
            {footerData.map((item, index) => (
              <div key={index}>
                <p className="text-xs text-neutral-500 mb-1">{item.label}</p>
                <p className="text-sm font-medium text-neutral-900">{item.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
