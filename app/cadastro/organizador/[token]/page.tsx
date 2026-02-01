import { redirect } from 'next/navigation'
import { validateInviteToken } from '@/lib/data/organizer-invites'
import OrganizerSignupForm from './organizer-signup-form'

interface PageProps {
    params: {
        token: string
    }
}

export const metadata = {
    title: 'Cadastro de Organizador - Symplepass',
}

export default async function OrganizerSignupPage({ params }: PageProps) {
    const { token } = params

    // Validate the invite token
    const validation = await validateInviteToken(token)

    if (!validation.valid || !validation.data) {
        // Token is invalid, expired, or already used
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                        Convite Inválido
                    </h1>
                    <p className="text-neutral-600 mb-6">
                        {validation.error || 'Este link de convite não é válido ou expirou.'}
                    </p>
                    <a
                        href="/"
                        className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        Voltar para o Início
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <img
                        src="/assets/symplepass-color.svg"
                        alt="SymplePass"
                        className="h-12 mx-auto mb-6"
                    />
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                        Bem-vindo ao SymplePass
                    </h1>
                    <p className="text-neutral-600">
                        Complete seu cadastro para começar a criar eventos incríveis
                    </p>
                    {validation.data.email && (
                        <p className="text-sm text-neutral-500 mt-2">
                            Convite para: <strong>{validation.data.email}</strong>
                        </p>
                    )}
                </div>

                {/* Signup Form */}
                <div className="bg-white rounded-lg shadow-lg p-8">
                    <OrganizerSignupForm token={token} prefilledEmail={validation.data.email} />
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-neutral-500 mt-6">
                    Ao criar sua conta, você concorda com nossos{' '}
                    <a href="/termos-de-uso" className="text-orange-600 hover:underline">
                        Termos de Uso
                    </a>{' '}
                    e{' '}
                    <a href="/politica-de-privacidade" className="text-orange-600 hover:underline">
                        Política de Privacidade
                    </a>
                </p>
            </div>
        </div>
    )
}
