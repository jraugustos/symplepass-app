'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { signUpOrganizerAction, consumeInviteTokenAction } from '@/app/actions/organizer-signup'

interface OrganizerSignupFormProps {
    token: string
    prefilledEmail?: string | null
}

export default function OrganizerSignupForm({ token, prefilledEmail }: OrganizerSignupFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        email: prefilledEmail || '',
        password: '',
        confirmPassword: '',
        companyName: '',
        phone: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.fullName.trim()) {
            toast.error('Por favor, informe seu nome completo')
            return
        }

        if (!formData.email.trim()) {
            toast.error('Por favor, informe seu email')
            return
        }

        if (formData.password.length < 6) {
            toast.error('A senha deve ter no mínimo 6 caracteres')
            return
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('As senhas não coincidem')
            return
        }

        setLoading(true)

        try {
            // Create the user account (skips email confirmation)
            const signupResult = await signUpOrganizerAction({
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phone: formData.phone || undefined,
            })

            if (signupResult.error) {
                toast.error(signupResult.error)
                setLoading(false)
                return
            }

            if (!signupResult.userId) {
                toast.error('Erro ao criar conta')
                setLoading(false)
                return
            }

            // Consume the invite token and update role to organizer
            const consumeResult = await consumeInviteTokenAction(token, signupResult.userId)

            if (consumeResult.error) {
                toast.error('Conta criada, mas houve um erro ao ativar o perfil de organizador. Entre em contato com o suporte.')
                setLoading(false)
                return
            }

            // TODO: Create organizer profile with company name
            // This could be done via a separate action or as part of consumeInviteToken

            toast.success('Conta criada com sucesso!')

            // Redirect to success page with next steps
            router.push('/cadastro/organizador/sucesso')

        } catch (error) {
            console.error('Signup error:', error)
            toast.error('Erro ao criar conta. Tente novamente.')
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Seu nome completo"
                    className="mt-1"
                />
            </div>

            {/* Email */}
            <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="seu@email.com"
                    className="mt-1"
                    disabled={!!prefilledEmail}
                />
                {prefilledEmail && (
                    <p className="text-xs text-neutral-500 mt-1">
                        Este email foi pré-definido no convite
                    </p>
                )}
            </div>

            {/* Company Name */}
            <div>
                <Label htmlFor="companyName">Nome da Empresa/Organização</Label>
                <Input
                    id="companyName"
                    name="companyName"
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Nome da sua empresa ou organização"
                    className="mt-1"
                />
                <p className="text-xs text-neutral-500 mt-1">
                    Você poderá completar seu perfil depois
                </p>
            </div>

            {/* Phone */}
            <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                />
            </div>

            {/* Password */}
            <div>
                <Label htmlFor="password">Senha *</Label>
                <div className="relative mt-1">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                    >
                        {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                        ) : (
                            <Eye className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Confirm Password */}
            <div>
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Digite a senha novamente"
                    className="mt-1"
                />
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={loading}
                className="w-full"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Criando conta...
                    </>
                ) : (
                    'Criar Conta'
                )}
            </Button>

            {/* Login Link */}
            <p className="text-center text-sm text-neutral-600">
                Já tem uma conta?{' '}
                <a href="/login" className="text-orange-600 hover:underline font-medium">
                    Fazer login
                </a>
            </p>
        </form>
    )
}
