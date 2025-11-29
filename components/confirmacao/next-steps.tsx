interface NextStepsProps {
  userEmail: string
  kitPickupDate: string
  eventDate: string
}

export function NextSteps({ userEmail, kitPickupDate, eventDate }: NextStepsProps) {
  const steps = [
    {
      title: 'Retirada do kit',
      description: kitPickupDate,
    },
    {
      title: 'Dia do evento',
      description: `Chegue 30min antes do horário (${eventDate}).`,
    },
  ]

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm" data-animate>
      <h3 className="text-lg font-semibold text-slate-900">Próximos passos</h3>
      <div className="mt-6 space-y-4">
        {steps.map((step, index) => (
          <div key={step.title} className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 font-semibold text-slate-600">
              {index + 1}
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">{step.title}</p>
              <p className="text-sm text-slate-500">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
