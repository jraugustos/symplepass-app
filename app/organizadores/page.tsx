import { ComingSoonLayout } from '@/components/layout/coming-soon-layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Organizadores | SymplePass',
    description: 'Em breve você poderá cadastrar seu evento conosco. Entre em contato para mais informações.',
}

export default function OrganizadoresPage() {
    return (
        <ComingSoonLayout
            title="Para Organizadores"
            description="Em breve você poderá cadastrar seu evento conosco. Enquanto isso, entre em contato com nossa equipe."
            showContact={true}
        />
    )
}
