import { ComingSoonLayout } from '@/components/layout/coming-soon-layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Clube de Benefícios | SymplePass',
    description: 'Em breve uma nova experiência de benefícios exclusivos para você.',
}

export default function ClubeBeneficiosPage() {
    return (
        <ComingSoonLayout
            title="Clube de Benefícios"
            description="Em breve uma nova experiência de benefícios exclusivos para você."
            showContact={false}
        />
    )
}
