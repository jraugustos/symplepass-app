-- Query para verificar se o constraint foi atualizado corretamente

-- 1. Ver o constraint atual da tabela events
SELECT conname, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'events'::regclass
AND conname LIKE '%status%';

-- 2. Tentar atualizar um evento para o novo status (teste)
-- SUBSTITUA 'SEU_EVENT_ID_AQUI' pelo ID de um evento real
-- UPDATE events
-- SET status = 'published_no_registration'
-- WHERE id = 'SEU_EVENT_ID_AQUI';

-- 3. Verificar se a atualização funcionou
-- SELECT id, title, status
-- FROM events
-- WHERE id = 'SEU_EVENT_ID_AQUI';
