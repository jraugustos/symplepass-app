-- Script para criar um usuário admin no Supabase
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Primeiro, vamos verificar se existe algum usuário com o email
SELECT id, email FROM auth.users WHERE email = 'ojraugusto@gmail.com';

-- 2. Se o usuário não existir, você precisa criá-lo primeiro através da interface do Supabase
-- ou usando a API de autenticação

-- 3. Se o usuário já existir, pegue o ID do resultado acima e substitua no comando abaixo
-- Substitua 'USER_ID_HERE' pelo ID real do usuário

-- Criar ou atualizar o perfil para admin
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'USER_ID_HERE', -- substitua pelo ID do usuário
  'ojraugusto@gmail.com',
  'Administrador',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id)
DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- Verificar se funcionou
SELECT * FROM public.profiles WHERE email = 'ojraugusto@gmail.com';