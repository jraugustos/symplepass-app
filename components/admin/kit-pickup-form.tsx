'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { KitPickupInfo } from '@/types'

interface KitPickupFormProps {
    pickupInfo: any
    onPickupInfoUpdate: (data: any) => Promise<void>
}

export function KitPickupForm({
    pickupInfo,
    onPickupInfoUpdate,
}: KitPickupFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [pickupFormData, setPickupFormData] = useState({
        dates: pickupInfo?.dates || '',
        hours: pickupInfo?.hours || '',
        location: pickupInfo?.location || '',
        notes: pickupInfo?.notes || '',
        google_maps_url: pickupInfo?.google_maps_url || '',
    })

    // Sync pickupFormData when pickupInfo prop changes
    useEffect(() => {
        setPickupFormData({
            dates: pickupInfo?.dates || '',
            hours: pickupInfo?.hours || '',
            location: pickupInfo?.location || '',
            notes: pickupInfo?.notes || '',
            google_maps_url: pickupInfo?.google_maps_url || '',
        })
    }, [pickupInfo])

    const handlePickupInfoSave = async () => {
        setIsSubmitting(true)
        try {
            await onPickupInfoUpdate(pickupFormData)
        } catch (error) {
            console.error('Error saving pickup info:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Datas
                    </label>
                    <Input
                        value={pickupFormData.dates}
                        onChange={(e) =>
                            setPickupFormData({ ...pickupFormData, dates: e.target.value })
                        }
                        placeholder="Ex: 13 e 14 de Mar"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Horários
                    </label>
                    <Input
                        value={pickupFormData.hours}
                        onChange={(e) =>
                            setPickupFormData({ ...pickupFormData, hours: e.target.value })
                        }
                        placeholder="Ex: 10h às 20h"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Local
                </label>
                <Input
                    value={pickupFormData.location}
                    onChange={(e) =>
                        setPickupFormData({ ...pickupFormData, location: e.target.value })
                    }
                    placeholder="Ex: Ginásio do Ibirapuera — Portão 7"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Link Google Maps
                </label>
                <Input
                    value={pickupFormData.google_maps_url}
                    onChange={(e) =>
                        setPickupFormData({ ...pickupFormData, google_maps_url: e.target.value })
                    }
                    placeholder="Ex: https://maps.google.com/..."
                />
                <p className="text-xs text-neutral-500 mt-1">
                    Cole o link do Google Maps para o local de retirada do kit
                </p>
            </div>
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Observações
                </label>
                <textarea
                    value={pickupFormData.notes}
                    onChange={(e) =>
                        setPickupFormData({ ...pickupFormData, notes: e.target.value })
                    }
                    rows={3}
                    placeholder="Informações adicionais sobre a retirada"
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
            </div>
            <div className="flex justify-end">
                <Button onClick={handlePickupInfoSave} disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Informações de Retirada'}
                </Button>
            </div>
        </div>
    )
}
