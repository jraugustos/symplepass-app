'use client'

import Image from 'next/image'
import { MapPin, TrendingUp, TrendingDown, Mountain, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventCourseInfo } from '@/types'

interface EventCourseSectionProps {
    courseInfo: EventCourseInfo | null
}

export function EventCourseSection({ courseInfo }: EventCourseSectionProps) {
    if (!courseInfo) return null

    return (
        <section className="py-12 bg-neutral-50" id="course">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold text-neutral-900 mb-8 font-geist">Percurso e Altimetria</h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Map and Actions */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Map Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                            {courseInfo.map_image_url ? (
                                <div className="relative aspect-video w-full bg-neutral-100">
                                    <Image
                                        src={courseInfo.map_image_url}
                                        alt="Mapa do percurso"
                                        fill
                                        className="object-cover"
                                    />

                                    {/* Overlay Actions */}
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                        {courseInfo.google_maps_url && (
                                            <Button
                                                size="sm"
                                                className="bg-white text-neutral-900 hover:bg-neutral-100 shadow-md border border-neutral-200"
                                                onClick={() => window.open(courseInfo.google_maps_url!, '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4 mr-2" />
                                                Google Maps
                                            </Button>
                                        )}
                                        {courseInfo.gpx_file_url && (
                                            <Button
                                                size="sm"
                                                className="bg-primary-600 text-white hover:bg-primary-700 shadow-md"
                                                onClick={() => window.open(courseInfo.gpx_file_url!, '_blank')}
                                            >
                                                <Download className="w-4 h-4 mr-2" />
                                                Baixar GPX
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="aspect-video w-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>Mapa do percurso em breve</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Course Notes */}
                        {courseInfo.course_notes && (
                            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
                                <h4 className="font-medium text-neutral-900 mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-primary-500" />
                                    Observações do Percurso
                                </h4>
                                <p className="text-neutral-600 text-sm leading-relaxed">
                                    {courseInfo.course_notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Stats and Support */}
                    <div className="space-y-6">
                        {/* Elevation Stats */}
                        <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
                            <h3 className="font-medium text-neutral-900 mb-4">Dados Técnicos</h3>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-neutral-600">Ganho de Elevação</span>
                                    </div>
                                    <span className="font-semibold text-neutral-900">
                                        {courseInfo.elevation_gain ? `${courseInfo.elevation_gain}m` : '-'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <TrendingDown className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-neutral-600">Perda de Elevação</span>
                                    </div>
                                    <span className="font-semibold text-neutral-900">
                                        {courseInfo.elevation_loss ? `${courseInfo.elevation_loss}m` : '-'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                            <Mountain className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-neutral-600">Altitude Máxima</span>
                                    </div>
                                    <span className="font-semibold text-neutral-900">
                                        {courseInfo.max_elevation ? `${courseInfo.max_elevation}m` : '-'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Support Points */}
                        {courseInfo.support_points && courseInfo.support_points.length > 0 && (
                            <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm">
                                <h3 className="font-medium text-neutral-900 mb-4">Pontos de Apoio</h3>
                                <ul className="space-y-3">
                                    {courseInfo.support_points.map((point, idx) => (
                                        <li key={idx} className="flex items-start gap-3 text-sm text-neutral-600">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Start/Finish Location */}
                        {courseInfo.start_finish_location && (
                            <div className="bg-neutral-900 text-white rounded-xl p-6 shadow-sm">
                                <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Largada e Chegada
                                </h3>
                                <p className="text-neutral-300 text-sm">
                                    {courseInfo.start_finish_location}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
