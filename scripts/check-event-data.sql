-- Script para verificar os dados do evento

-- 1. Verificar se as colunas existem na tabela events
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name IN ('event_type', 'solidarity_message', 'has_organizer', 'start_date')
ORDER BY column_name;

-- 2. Verificar os dados do evento específico
SELECT
    id,
    title,
    slug,
    event_type,
    solidarity_message,
    has_organizer,
    start_date,
    TO_CHAR(start_date AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI') as horario_formatado
FROM events
WHERE slug = '1-taca-aabb-diario-santista-de-beach-tenis';

-- 3. Verificar se o tipo event_type existe
SELECT
    typname,
    enumlabel
FROM pg_type
JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
WHERE typname = 'event_type'
ORDER BY enumlabel;