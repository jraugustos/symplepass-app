'use client'

import { Calendar, CalendarPlus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { generateICSFile, slugify } from '@/lib/utils'

type ActionButtonsProps = {
  eventTitle: string
  eventDateDisplay: string
  eventLocation: string
  ticketCode: string
  eventStart: string
  eventEnd: string
}

export function ActionButtons(props: ActionButtonsProps) {
  const {
    eventTitle,
    eventDateDisplay,
    eventLocation,
    ticketCode,
    eventStart,
    eventEnd,
  } = props
  const router = useRouter()

  const handleCalendarDownload = () => {
    const start = new Date(eventStart)

    if (Number.isNaN(start.getTime())) {
      console.warn('Invalid event start date for ICS generation:', eventStart)
      return
    }

    const icsContent = generateICSFile({
      title: eventTitle,
      description: `Ingresso ${ticketCode} - ${eventDateDisplay}`,
      location: eventLocation,
      startDate: start.toISOString(),
      endDate: eventEnd || start.toISOString(),
    })

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${slugify(eventTitle)}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2" data-animate>
      <Button
        variant="outline"
        className="h-14 rounded-2xl border-slate-200 text-base font-semibold text-slate-700"
        onClick={() => router.push('/meus-eventos')}
      >
        <Calendar className="mr-2 h-5 w-5" />
        Ver meus eventos
      </Button>
      <Button
        variant="outline"
        className="h-14 rounded-2xl border-slate-200 text-base font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-600"
        onClick={handleCalendarDownload}
      >
        <CalendarPlus className="mr-2 h-5 w-5" />
        Adicionar ao calendário
      </Button>
    </div>
  )
}
