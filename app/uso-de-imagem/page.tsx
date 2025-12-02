import { LegalLayout } from '@/components/layout/legal-layout'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Uso de Imagem | SymplePass',
    description: 'Termo de Autorização de Uso de Imagem da SymplePass.',
}

export default function ImageUsagePage() {
    return (
        <LegalLayout title="Uso de Imagem" lastUpdated="1/12/2025">
            <p>
                Eu, autorizo o uso da minha imagem, voz e nome registrados durante o evento em que fiz minha inscrição.
            </p>
            <p>
                Permito que fotos e vídeos sejam utilizados, gratuitamente, pelos organizadores, em mídias digitais, redes sociais e materiais de divulgação do evento.
            </p>
        </LegalLayout>
    )
}
