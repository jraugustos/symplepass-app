import { ExternalLink, Download, TrendingUp } from 'lucide-react'
import type { EventCourseInfo } from '@/types/database.types'
import { EVENT_PAGE_CONTENT_CLASS } from './layout-constants'

interface EventCourseProps {
  courseInfo: EventCourseInfo | null
}

export default function EventCourse({ courseInfo }: EventCourseProps) {
  if (!courseInfo) {
    return (
      <section id="percurso" className="py-12 scroll-mt-40">
        <div className={EVENT_PAGE_CONTENT_CLASS}>
          <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">Percurso</h2>
          <p className="text-neutral-600">Informações do percurso em breve.</p>
        </div>
      </section>
    )
  }

  const isChampionship = courseInfo.specification_type === 'championship_format'
  const title = isChampionship ? 'Formato do Campeonato' : 'Percurso'

  return (
    <section id="percurso" className="py-12 scroll-mt-40">
      <div className={EVENT_PAGE_CONTENT_CLASS}>
        <h2 className="text-2xl sm:text-3xl font-semibold font-geist mb-6">{title}</h2>

        {/* Map/Image Container */}
        <div className="relative rounded-2xl overflow-hidden border border-neutral-200 mb-6">
          {courseInfo.map_image_url ? (
            <img
              src={courseInfo.map_image_url}
              alt={isChampionship ? "Imagem ilustrativa do formato" : "Mapa do percurso"}
              className="w-full aspect-[16/9] object-cover"
            />
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
              <p className="text-neutral-500">{isChampionship ? "Imagem do formato" : "Mapa do percurso"}</p>
            </div>
          )}

          {/* Overlay Buttons */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2">
            {courseInfo.google_maps_url && (
              <a
                href={courseInfo.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir no Google Maps
              </a>
            )}
            {!isChampionship && courseInfo.gpx_file_url && (
              <a
                href={courseInfo.gpx_file_url}
                download
                className="rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white/90 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Baixar GPX
              </a>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Start/Finish or Format Details Card */}
          <div className={`rounded-xl border border-neutral-200 bg-white p-4 ${isChampionship ? 'lg:col-span-3' : ''}`}>
            <h3 className="font-medium font-geist mb-3">
              {isChampionship ? 'Detalhes do Formato' : 'Largada / Chegada'}
            </h3>
            {!isChampionship && (
              <p className="text-sm text-neutral-600 mb-4">
                {courseInfo.start_finish_location || 'A definir'}
              </p>
            )}
            {courseInfo.course_notes && (
              <p className="text-sm text-neutral-600 whitespace-pre-wrap">{courseInfo.course_notes}</p>
            )}
          </div>

          {/* Altimetry Card - Only for Course */}
          {!isChampionship && (courseInfo.elevation_gain || courseInfo.elevation_loss || courseInfo.max_elevation) && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                <h3 className="font-medium font-geist">Altimetria</h3>
              </div>
              <div className="space-y-2 text-sm">
                {courseInfo.elevation_gain !== null && (
                  <p className="flex justify-between">
                    <span className="text-neutral-600">Ganho de elevação:</span>
                    <span className="font-medium">{courseInfo.elevation_gain}m</span>
                  </p>
                )}
                {courseInfo.elevation_loss !== null && (
                  <p className="flex justify-between">
                    <span className="text-neutral-600">Perda de elevação:</span>
                    <span className="font-medium">{courseInfo.elevation_loss}m</span>
                  </p>
                )}
                {courseInfo.max_elevation !== null && (
                  <p className="flex justify-between">
                    <span className="text-neutral-600">Elevação máxima:</span>
                    <span className="font-medium">{courseInfo.max_elevation}m</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Support Points Card - Only for Course */}
          {!isChampionship && courseInfo.support_points && courseInfo.support_points.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="font-medium font-geist mb-3">Pontos de apoio</h3>
              <ul className="space-y-2">
                {courseInfo.support_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
