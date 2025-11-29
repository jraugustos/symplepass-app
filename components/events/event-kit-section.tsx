'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Package, Shirt, Medal, ShoppingBag, Droplets, BookOpen, Gift, Barcode } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { EventKitItem } from '@/types'

interface EventKitSectionProps {
    kitItems: EventKitItem[]
    pickupInfo: any
}

const ICON_MAP: Record<string, any> = {
    'shirt': Shirt,
    'barcode': Barcode,
    'medal': Medal,
    'shopping-bag': ShoppingBag,
    'droplets': Droplets,
    'book-open': BookOpen,
    'gift': Gift,
    'package': Package,
}

export function EventKitSection({ kitItems, pickupInfo }: EventKitSectionProps) {
    const [currentSlide, setCurrentSlide] = useState(0)

    // Filter items that have images for the carousel
    const carouselItems = kitItems.filter(item => item.image_url)

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
    }

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + carouselItems.length) % carouselItems.length)
    }

    if (kitItems.length === 0 && !pickupInfo) return null

    return (
        <section className="py-12 bg-white" id="kit">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row gap-12 items-start">

                    {/* Left Column: Kit Visuals (Carousel) */}
                    <div className="w-full md:w-1/2">
                        <h2 className="text-2xl font-bold text-neutral-900 mb-6 font-geist">Kit do Atleta</h2>

                        {carouselItems.length > 0 ? (
                            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-neutral-100 mb-6 group">
                                <Image
                                    src={carouselItems[currentSlide].image_url!}
                                    alt={carouselItems[currentSlide].name}
                                    fill
                                    className="object-cover"
                                />

                                {/* Carousel Controls */}
                                {carouselItems.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevSlide}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                        >
                                            <ChevronLeft className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={nextSlide}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                        >
                                            <ChevronRight className="w-6 h-6" />
                                        </button>

                                        {/* Indicators */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                            {carouselItems.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentSlide(idx)}
                                                    className={`w-2 h-2 rounded-full transition-all ${currentSlide === idx ? 'bg-white w-6' : 'bg-white/50'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* Caption */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent text-white">
                                    <p className="font-medium">{carouselItems[currentSlide].name}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-neutral-100 mb-6 flex items-center justify-center text-neutral-400">
                                <Package className="w-16 h-16" />
                            </div>
                        )}

                        {/* Kit Items List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {kitItems.map((item) => {
                                const Icon = ICON_MAP[item.icon] || Package
                                return (
                                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50">
                                        <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-neutral-900">{item.name}</h4>
                                            <p className="text-sm text-neutral-600">{item.description}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right Column: Pickup Info */}
                    <div className="w-full md:w-1/2">
                        <div className="bg-neutral-900 text-white rounded-2xl p-8 relative overflow-hidden">
                            {/* Decorative background elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-6 font-geist">Retirada de Kit</h3>

                                {pickupInfo ? (
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-neutral-400 text-sm mb-1 uppercase tracking-wider font-medium">Quando</p>
                                            <p className="text-lg font-medium">{pickupInfo.dates}</p>
                                            <p className="text-neutral-300">{pickupInfo.hours}</p>
                                        </div>

                                        <div>
                                            <p className="text-neutral-400 text-sm mb-1 uppercase tracking-wider font-medium">Onde</p>
                                            <p className="text-lg font-medium">{pickupInfo.location}</p>
                                        </div>

                                        {pickupInfo.notes && (
                                            <div className="pt-4 border-t border-white/10">
                                                <p className="text-neutral-300 text-sm leading-relaxed">
                                                    {pickupInfo.notes}
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-4">
                                            <button className="w-full py-3 px-4 bg-white text-neutral-900 rounded-lg font-medium hover:bg-neutral-100 transition-colors">
                                                Ver no Mapa
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-neutral-400">Informações de retirada em breve.</p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    )
}
