import { UserPreferences } from '@/types'
import { getSportLabel } from '@/lib/constants/sports'
import { Badge } from '@/components/ui/badge'

interface UserPreferencesAdminProps {
    preferences: UserPreferences | null
}

export function UserPreferencesAdmin({ preferences }: UserPreferencesAdminProps) {
    if (!preferences) {
        return (
            <div className="text-center py-6 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-neutral-500">Nenhuma preferência registrada.</p>
            </div>
        )
    }

    const hasSports = preferences.favorite_sports && preferences.favorite_sports.length > 0

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-medium text-neutral-600 mb-2">Esportes Preferidos</h3>
                {hasSports ? (
                    <div className="flex flex-wrap gap-2">
                        {preferences.favorite_sports?.map((sport) => (
                            <Badge key={sport} variant="secondary">
                                {getSportLabel(sport) || sport}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-neutral-500">Nenhum esporte selecionado.</p>
                )}
            </div>

            <div className="pt-4 border-t border-neutral-100">
                <h3 className="text-sm font-medium text-neutral-600 mb-2">Notificações</h3>
                <ul className="space-y-2 text-sm text-neutral-900">
                    <li className="flex items-center gap-2">
                        <span className={preferences.notification_events ? "text-success" : "text-neutral-400"}>
                            {preferences.notification_events ? "✓" : "✗"}
                        </span>
                        Eventos
                    </li>
                    <li className="flex items-center gap-2">
                        <span className={preferences.notification_promotions ? "text-success" : "text-neutral-400"}>
                            {preferences.notification_promotions ? "✓" : "✗"}
                        </span>
                        Promoções
                    </li>
                </ul>
            </div>
        </div>
    )
}
