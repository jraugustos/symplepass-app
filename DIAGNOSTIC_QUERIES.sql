-- DIAGNOSTIC QUERIES FOR EVENT ISSUES
-- Execute estas queries no Supabase SQL Editor para diagnosticar problemas

-- 1. Verificar se há eventos duplicados (mesmoID)
SELECT id, COUNT(*) as count
FROM events
GROUP BY id
HAVING COUNT(*) > 1;
-- Se retornar linhas, há duplicatas!

-- 2. Verificar o evento específico que está dando problema
-- (Substitua 'EVENT_ID_AQUI' pelo ID do evento que está dando erro)
SELECT *
FROM events
WHERE id = 'EVENT_ID_AQUI';
-- Se retornar mais de uma linha, há duplicata

-- 3. Verificar constraints da tabela events
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'events'::regclass;
-- Deve mostrar primary key e check constraints

-- 4. Verificar índices da tabela events
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'events';

-- 5. Contar total de eventos por status
SELECT status, COUNT(*) as count
FROM events
GROUP BY status
ORDER BY count DESC;

-- 6. Se você encontrar duplicatas, pode removê-las assim:
-- CUIDADO: Execute apenas se confirmar que há duplicatas!
-- DELETE FROM events a
-- USING events b
-- WHERE a.id = b.id
-- AND a.ctid < b.ctid;
