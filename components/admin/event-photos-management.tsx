'use client'

import { useState } from 'react'
import { PhotosUpload } from './photos-upload'
import { PhotoPackagesForm } from './photo-packages-form'
import { PhotoPricingTiersForm } from './photo-pricing-tiers-form'
import { PhotoOrdersPageClient } from './photo-orders-page-client'
import type { EventPhoto, PhotoPackage, PhotoPricingTier } from '@/types/database.types'
import type { AdminPhotoOrderWithDetails, CreatePhotoData, PhotoOrderFilters } from '@/lib/data/admin-photos'
import type { PhotoPackageFormData, PhotoPricingTierFormData } from '@/types'

type TabId = 'photos' | 'pricing' | 'orders'

interface EventPhotosManagementProps {
  eventId: string
  photos: EventPhoto[]
  /** @deprecated Use pricingTiers instead */
  packages: PhotoPackage[]
  pricingTiers: PhotoPricingTier[]
  orders: AdminPhotoOrderWithDetails[]
  totalOrders: number
  onPhotoCreate: (data: Omit<CreatePhotoData, 'event_id'>) => Promise<any>
  onPhotoDelete: (photoId: string) => Promise<void>
  onPhotosReorder: (items: { id: string; display_order: number }[]) => Promise<void>
  /** @deprecated Use onPricingTierCreate instead */
  onPackageCreate: (data: PhotoPackageFormData) => Promise<any>
  /** @deprecated Use onPricingTierUpdate instead */
  onPackageUpdate: (packageId: string, data: PhotoPackageFormData) => Promise<any>
  /** @deprecated Use onPricingTierDelete instead */
  onPackageDelete: (packageId: string) => Promise<void>
  /** @deprecated Use onPricingTiersReorder instead */
  onPackagesReorder: (items: { id: string; display_order: number }[]) => Promise<void>
  onPricingTierCreate: (data: PhotoPricingTierFormData) => Promise<any>
  onPricingTierUpdate: (tierId: string, data: PhotoPricingTierFormData) => Promise<any>
  onPricingTierDelete: (tierId: string) => Promise<void>
  onPricingTiersReorder: (items: { id: string; display_order: number }[]) => Promise<void>
  onFilterOrders: (filters: PhotoOrderFilters) => Promise<{ orders: AdminPhotoOrderWithDetails[]; total: number }>
  onExportOrders: (filters: Omit<PhotoOrderFilters, 'page' | 'pageSize'>) => Promise<string>
}

export function EventPhotosManagement({
  eventId,
  photos,
  packages,
  pricingTiers,
  orders,
  totalOrders,
  onPhotoCreate,
  onPhotoDelete,
  onPhotosReorder,
  onPackageCreate,
  onPackageUpdate,
  onPackageDelete,
  onPackagesReorder,
  onPricingTierCreate,
  onPricingTierUpdate,
  onPricingTierDelete,
  onPricingTiersReorder,
  onFilterOrders,
  onExportOrders,
}: EventPhotosManagementProps) {
  const [activeTab, setActiveTab] = useState<TabId>('photos')

  const tabs = [
    { id: 'photos' as TabId, label: 'Fotos do Evento', count: photos.length },
    { id: 'pricing' as TabId, label: 'Faixas de Preço', count: pricingTiers.length },
    { id: 'orders' as TabId, label: 'Pedidos', count: totalOrders },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex gap-4 -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'photos' && (
          <PhotosUpload
            eventId={eventId}
            photos={photos}
            onPhotoCreate={onPhotoCreate}
            onPhotoDelete={onPhotoDelete}
            onPhotosReorder={onPhotosReorder}
          />
        )}

        {activeTab === 'pricing' && (
          <PhotoPricingTiersForm
            eventId={eventId}
            tiers={pricingTiers}
            onCreate={onPricingTierCreate}
            onUpdate={onPricingTierUpdate}
            onDelete={onPricingTierDelete}
            onReorder={onPricingTiersReorder}
          />
        )}

        {activeTab === 'orders' && (
          <PhotoOrdersPageClient
            eventId={eventId}
            initialOrders={orders}
            initialTotal={totalOrders}
            onFilterOrders={onFilterOrders}
            onExportOrders={onExportOrders}
          />
        )}
      </div>
    </div>
  )
}
