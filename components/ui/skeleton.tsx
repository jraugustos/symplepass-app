import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
    variant?: 'default' | 'circle' | 'text'
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
    const baseClasses = 'relative overflow-hidden bg-neutral-200'

    const variantClasses = {
        default: 'rounded-lg',
        circle: 'rounded-full',
        text: 'rounded',
    }

    return (
        <div
            className={cn(
                baseClasses,
                variantClasses[variant],
                'before:absolute before:inset-0 before:-translate-x-full',
                'before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
                'before:animate-shimmer',
                className
            )}
            style={{
                backgroundImage: 'linear-gradient(90deg, #e5e5e5 0%, #f5f5f5 50%, #e5e5e5 100%)',
                backgroundSize: '1000px 100%',
            }}
        />
    )
}
