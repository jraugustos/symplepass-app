/**
 * Script to verify Supabase Storage configuration
 *
 * Run with: npx tsx scripts/check-storage.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../.env.local') })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente não configuradas')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkStorageConfiguration() {
  console.log('🔍 Verificando configuração do Supabase Storage...\n')

  // 1. Check if we can list buckets
  console.log('1️⃣ Verificando acesso aos buckets...')
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

  if (bucketsError) {
    console.error('   ❌ Erro ao listar buckets:', bucketsError.message)
    return
  }

  console.log('   ✅ Buckets encontrados:', buckets?.length || 0)
  buckets?.forEach(bucket => {
    console.log(`      - ${bucket.name} (${bucket.public ? 'público' : 'privado'})`)
  })

  // 2. Check if event-banners bucket exists
  console.log('\n2️⃣ Verificando bucket "event-banners"...')
  const eventBannersBucket = buckets?.find(b => b.name === 'event-banners')

  if (!eventBannersBucket) {
    console.log('   ⚠️  Não foi possível listar buckets (permissão necessária)')
    console.log('   ℹ️  Isso é normal com ANON_KEY - vamos testar o upload mesmo assim...')
  } else {
    console.log('   ✅ Bucket existe')
    console.log('      Público:', eventBannersBucket.public ? 'Sim' : 'Não')
    console.log('      ID:', eventBannersBucket.id)
  }

  // 3. Try to list files in the bucket
  console.log('\n3️⃣ Verificando acesso de leitura ao bucket...')
  const { data: files, error: listError } = await supabase.storage
    .from('event-banners')
    .list()

  if (listError) {
    console.error('   ❌ Erro ao listar arquivos:', listError.message)
  } else {
    console.log('   ✅ Acesso de leitura OK')
    console.log('      Arquivos no bucket:', files?.length || 0)
  }

  // 4. Test upload permission (create a tiny test file)
  console.log('\n4️⃣ Testando permissão de upload...')
  const testFileName = `test-${Date.now()}.txt`
  const testFile = new Blob(['test'], { type: 'text/plain' })

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('event-banners')
    .upload(testFileName, testFile)

  if (uploadError) {
    console.error('   ❌ Erro ao fazer upload de teste:', uploadError.message)
    console.log('\n   💡 Possíveis causas:')
    console.log('      - Políticas RLS não configuradas')
    console.log('      - Usuário não autenticado ou sem permissão')
    console.log('      - Bucket não permite uploads públicos')
    console.log('\n   💡 Solução: Verifique as políticas RLS no Supabase Dashboard:')
    console.log('      Storage > event-banners > Policies')
  } else {
    console.log('   ✅ Upload de teste bem-sucedido!')
    console.log('      Path:', uploadData.path)

    // Clean up test file
    console.log('\n5️⃣ Limpando arquivo de teste...')
    const { error: deleteError } = await supabase.storage
      .from('event-banners')
      .remove([testFileName])

    if (deleteError) {
      console.error('   ⚠️  Não foi possível deletar o arquivo de teste:', deleteError.message)
    } else {
      console.log('   ✅ Arquivo de teste removido')
    }
  }

  // 6. Check current user
  console.log('\n6️⃣ Verificando usuário atual...')
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.log('   ⚠️  Nenhum usuário autenticado')
    console.log('      Isso é esperado se você estiver rodando o script localmente')
    console.log('      O upload só funcionará se o usuário estiver autenticado com role admin/organizer')
  } else {
    console.log('   ✅ Usuário autenticado:', user.email)
    console.log('      ID:', user.id)
  }

  console.log('\n✨ Verificação concluída!\n')
}

checkStorageConfiguration().catch(console.error)
