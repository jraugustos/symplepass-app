/**
 * Sport Categories and Types
 * Used for event categorization and user interest segmentation
 */

export const SPORT_CATEGORIES = {
  endurance: {
    label: 'Endurance / Outdoor',
    items: [
      { value: 'corrida', label: 'Corrida de Rua' },
      { value: 'caminhada', label: 'Caminhada' },
      { value: 'trail_running', label: 'Trail Running' },
      { value: 'ciclismo', label: 'Ciclismo de Estrada' },
      { value: 'mountain_bike', label: 'Mountain Bike (MTB)' },
      { value: 'triatlo', label: 'Triatlo' },
      { value: 'duatlo', label: 'Duatlo' },
      { value: 'natacao', label: 'Natação' },
      { value: 'aguas_abertas', label: 'Natação em Águas Abertas' },
    ],
  },
  beach: {
    label: 'Esportes de Praia',
    items: [
      { value: 'beach_tenis', label: 'Beach Tênis' },
      { value: 'futevolei', label: 'Futevôlei' },
      { value: 'volei_praia', label: 'Vôlei de Praia' },
      { value: 'surf', label: 'Surf' },
      { value: 'bodyboard', label: 'Bodyboard' },
      { value: 'kitesurf', label: 'Kitesurf' },
      { value: 'windsurf', label: 'Windsurf' },
      { value: 'stand_up_paddle', label: 'Stand Up Paddle (SUP)' },
      { value: 'beach_run', label: 'Beach Run' },
    ],
  },
  fitness: {
    label: 'Fitness / Indoor',
    items: [
      { value: 'crossfit', label: 'CrossFit' },
      { value: 'funcional', label: 'Treinamento Funcional' },
      { value: 'calistenia', label: 'Calistenia' },
      { value: 'academia', label: 'Academia / Musculação' },
      { value: 'spinning', label: 'Spinning' },
      { value: 'pilates', label: 'Pilates' },
      { value: 'yoga', label: 'Yoga' },
    ],
  },
  coletivos: {
    label: 'Esportes Coletivos',
    items: [
      { value: 'futebol', label: 'Futebol' },
      { value: 'futsal', label: 'Futsal' },
      { value: 'basquete', label: 'Basquete' },
      { value: 'volei', label: 'Vôlei' },
      { value: 'handebol', label: 'Handebol' },
      { value: 'rugby', label: 'Rugby' },
    ],
  },
  aventura: {
    label: 'Aventura / Natureza',
    items: [
      { value: 'canoagem', label: 'Canoagem' },
      { value: 'remo', label: 'Remo / Rowing' },
      { value: 'corrida_montanha', label: 'Corrida de Montanha' },
      { value: 'orientacao', label: 'Corrida de Orientação' },
      { value: 'rapel', label: 'Rapel' },
      { value: 'parkour', label: 'Parkour' },
    ],
  },
  urbanos: {
    label: 'Urbanos',
    items: [
      { value: 'patins', label: 'Patins / Inline' },
      { value: 'skate', label: 'Skate' },
      { value: 'longboard', label: 'Longboard' },
      { value: 'bike_urbana', label: 'Ciclismo Urbano' },
    ],
  },
  precisao: {
    label: 'Esportes de Precisão',
    items: [
      { value: 'tiro_com_arco', label: 'Tiro com Arco' },
      { value: 'tiro_esportivo', label: 'Tiro Esportivo' },
    ],
  },
  outros: {
    label: 'Outros',
    items: [
      { value: 'multiesportes', label: 'Multiesportes' },
      { value: 'obstaculos', label: 'Corrida de Obstáculos (OCR)' },
      { value: 'outro', label: 'Outro' },
    ],
  },
} as const

// Type for sport category keys
export type SportCategoryKey = keyof typeof SPORT_CATEGORIES

// Extract all sport values as a union type
type SportItem = (typeof SPORT_CATEGORIES)[SportCategoryKey]['items'][number]
export type SportValue = SportItem['value']

// Get all sports as a flat array
export function getAllSports(): Array<{ value: string; label: string; category: string }> {
  return Object.entries(SPORT_CATEGORIES).flatMap(([categoryKey, category]) =>
    category.items.map((item) => ({
      value: item.value,
      label: item.label,
      category: category.label,
    }))
  )
}

// Get all sport values as an array (for validation)
export function getAllSportValues(): string[] {
  return Object.values(SPORT_CATEGORIES).flatMap((category) =>
    category.items.map((item) => item.value)
  )
}

// Get sport label by value
export function getSportLabel(value: string): string | undefined {
  for (const category of Object.values(SPORT_CATEGORIES)) {
    const sport = category.items.find((item) => item.value === value)
    if (sport) return sport.label
  }
  return undefined
}

// Get category by sport value
export function getSportCategory(value: string): string | undefined {
  for (const category of Object.values(SPORT_CATEGORIES)) {
    const sport = category.items.find((item) => item.value === value)
    if (sport) return category.label
  }
  return undefined
}
