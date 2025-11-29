'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileUpload } from '@/components/ui/file-upload'
import type { EventCourseInfo, CourseInfoFormData } from '@/types'

interface CourseInfoFormProps {
    eventId: string
    courseInfo: EventCourseInfo | null
    onUpdate: (data: CourseInfoFormData) => Promise<void>
}

export function CourseInfoForm({ eventId, courseInfo, onUpdate }: CourseInfoFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formData, setFormData] = useState<CourseInfoFormData>({
        map_image_url: courseInfo?.map_image_url || null,
        google_maps_url: courseInfo?.google_maps_url || null,
        gpx_file_url: courseInfo?.gpx_file_url || null,
        start_finish_location: courseInfo?.start_finish_location || null,
        elevation_gain: courseInfo?.elevation_gain || null,
        elevation_loss: courseInfo?.elevation_loss || null,
        max_elevation: courseInfo?.max_elevation || null,
        support_points: courseInfo?.support_points || [],
        course_notes: courseInfo?.course_notes || null,
        specification_type: courseInfo?.specification_type || 'course',
    })

    const [error, setError] = useState<string | null>(null)
    const [newSupportPoint, setNewSupportPoint] = useState('')

    useEffect(() => {
        if (courseInfo) {
            setFormData({
                map_image_url: courseInfo.map_image_url,
                google_maps_url: courseInfo.google_maps_url,
                gpx_file_url: courseInfo.gpx_file_url,
                start_finish_location: courseInfo.start_finish_location,
                elevation_gain: courseInfo.elevation_gain,
                elevation_loss: courseInfo.elevation_loss,
                max_elevation: courseInfo.max_elevation,
                support_points: courseInfo.support_points,
                course_notes: courseInfo.course_notes,
                specification_type: courseInfo.specification_type || 'course',
            })
        }
    }, [courseInfo])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            await onUpdate(formData)
        } catch (error) {
            console.error('Error saving course info:', error)
            setError('Erro ao salvar informações. Verifique os dados e tente novamente.')
        } finally {
            setIsSubmitting(false)
        }
    }


    const handleAddSupportPoint = () => {
        if (newSupportPoint.trim()) {
            setFormData({
                ...formData,
                support_points: [...(formData.support_points || []), newSupportPoint.trim()],
            })
            setNewSupportPoint('')
        }
    }

    const handleRemoveSupportPoint = (index: number) => {
        const newPoints = [...(formData.support_points || [])]
        newPoints.splice(index, 1)
        setFormData({ ...formData, support_points: newPoints })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            {/* Specification Type Selector */}
            <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Tipo de Especificação
                </label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="specification_type"
                            value="course"
                            checked={formData.specification_type === 'course'}
                            onChange={() => setFormData({ ...formData, specification_type: 'course' })}
                            className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700">Percurso (Corrida, Ciclismo, etc)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="specification_type"
                            value="championship_format"
                            checked={formData.specification_type === 'championship_format'}
                            onChange={() => setFormData({ ...formData, specification_type: 'championship_format' })}
                            className="text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-neutral-700">Formato de Campeonato</span>
                    </label>
                </div>
            </div>

            {/* Map and Links */}
            <div className="space-y-4">
                <h4 className="font-medium">
                    {formData.specification_type === 'course' ? 'Mapa e Links' : 'Imagem e Links do Formato'}
                </h4>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        {formData.specification_type === 'course' ? 'Imagem do Mapa' : 'Imagem Ilustrativa'}
                    </label>
                    <FileUpload
                        bucket="event-media"
                        folder={`${eventId}/maps`}
                        value={formData.map_image_url ?? undefined}
                        onChange={(url) => setFormData({ ...formData, map_image_url: url })}
                        compress={true}
                        showPreview={true}
                        placeholder="Arraste uma imagem do mapa ou clique para selecionar"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Link do Google Maps
                    </label>
                    <Input
                        type="url"
                        value={formData.google_maps_url || ''}
                        onChange={(e) =>
                            setFormData({ ...formData, google_maps_url: e.target.value || null })
                        }
                        placeholder="https://maps.google.com/..."
                    />
                </div>

                {formData.specification_type === 'course' && (
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Arquivo GPX
                        </label>
                        <FileUpload
                            bucket="event-routes"
                            folder={`${eventId}/gpx`}
                            value={formData.gpx_file_url ?? undefined}
                            onChange={(url) => setFormData({ ...formData, gpx_file_url: url })}
                            compress={false}
                            showPreview={false}
                            acceptedTypes={['.gpx']}
                            placeholder="Arraste um arquivo GPX ou clique para selecionar"
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            Arquivo GPX com o traçado do percurso para download
                        </p>
                    </div>
                )}
            </div>

            {/* Location - Only for Course */}
            {formData.specification_type === 'course' && (
                <div className="border-t border-neutral-200 pt-6">
                    <h4 className="font-medium mb-4">Localização</h4>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Local de Largada e Chegada
                        </label>
                        <Input
                            value={formData.start_finish_location || ''}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    start_finish_location: e.target.value || null,
                                })
                            }
                            placeholder="Ex: Av. Pedro Álvares Cabral, 220 - Ibirapuera"
                        />
                    </div>
                </div>
            )}

            {/* Elevation Data - Only for Course */}
            {formData.specification_type === 'course' && (
                <div className="border-t border-neutral-200 pt-6">
                    <h4 className="font-medium mb-4">Altimetria</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Ganho de Elevação (m)
                            </label>
                            <Input
                                type="number"
                                value={formData.elevation_gain || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        elevation_gain: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                                placeholder="180"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Perda de Elevação (m)
                            </label>
                            <Input
                                type="number"
                                value={formData.elevation_loss || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        elevation_loss: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                                placeholder="175"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Altitude Máxima (m)
                            </label>
                            <Input
                                type="number"
                                value={formData.max_elevation || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        max_elevation: e.target.value ? Number(e.target.value) : null,
                                    })
                                }
                                placeholder="812"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Support Points - Only for Course */}
            {formData.specification_type === 'course' && (
                <div className="border-t border-neutral-200 pt-6">
                    <h4 className="font-medium mb-4">Pontos de Apoio</h4>
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <Input
                                value={newSupportPoint}
                                onChange={(e) => setNewSupportPoint(e.target.value)}
                                placeholder="Ex: Hidratação a cada 2,5 km"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleAddSupportPoint()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAddSupportPoint}
                                disabled={!newSupportPoint.trim()}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {formData.support_points && formData.support_points.length > 0 && (
                            <ul className="space-y-2">
                                {formData.support_points.map((point, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-neutral-50 rounded"
                                    >
                                        <span className="text-sm">{point}</span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveSupportPoint(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}

            {/* Course Notes */}
            <div className="border-t border-neutral-200 pt-6">
                <h4 className="font-medium mb-4">
                    {formData.specification_type === 'course' ? 'Observações do Percurso' : 'Detalhes do Formato'}
                </h4>
                <textarea
                    value={formData.course_notes || ''}
                    onChange={(e) =>
                        setFormData({ ...formData, course_notes: e.target.value || null })
                    }
                    rows={4}
                    placeholder={formData.specification_type === 'course' ? "Informações adicionais sobre o percurso..." : "Descreva o formato do campeonato, regras, pontuação, etc..."}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Especificações'}
                </Button>
            </div>
        </form>
    )
}
