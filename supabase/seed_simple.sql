-- Simplified Seed Data for Symplepass
-- Only essential data with ASCII characters

-- Insert test users into auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'organizer1@symplepass.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Paulo Silva"}', false, 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'organizer2@symplepass.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Santos"}', false, 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'user1@symplepass.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Joao Costa"}', false, 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Insert profiles
INSERT INTO profiles (id, email, full_name, cpf, phone, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'organizer1@symplepass.com', 'Paulo Silva', '123.456.789-01', '+55 11 98765-4321', 'organizer'),
  ('22222222-2222-2222-2222-222222222222', 'organizer2@symplepass.com', 'Maria Santos', '987.654.321-09', '+55 21 98765-4322', 'organizer'),
  ('33333333-3333-3333-3333-333333333333', 'user1@symplepass.com', 'Joao Costa', '456.789.123-45', '+55 11 98765-4323', 'user')
ON CONFLICT (id) DO NOTHING;

-- Insert events
INSERT INTO events (id, organizer_id, title, slug, description, sport_type, start_date, end_date, location, banner_url, status, max_participants, registration_start, registration_end, is_featured)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Maratona Internacional de Sao Paulo', 'maratona-sp-2025', 'A maior maratona do Brasil! Percurso de 42km pelas principais avenidas de Sao Paulo.', 'corrida', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days', '{"city": "Sao Paulo", "state": "SP", "venue": "Parque do Ibirapuera"}', 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800', 'published', 5000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '40 days', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Ironman Brasil - Florianopolis', 'ironman-floripa-2025', 'O desafio definitivo do triathlon! Natacao de 3.8km, ciclismo de 180km e corrida de 42km.', 'triatlo', NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days', '{"city": "Florianopolis", "state": "SC", "venue": "Praia de Jurere"}', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', 'published', 2000, NOW() - INTERVAL '60 days', NOW() + INTERVAL '50 days', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Volta Ciclistica de Curitiba', 'volta-curitiba-2025', 'Pedal urbano de 50km pelos parques e ciclovias de Curitiba.', 'ciclismo', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days', '{"city": "Curitiba", "state": "PR", "venue": "Parque Barigui"}', 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800', 'published', 1500, NOW() - INTERVAL '15 days', NOW() + INTERVAL '25 days', true);

-- Insert event categories
INSERT INTO event_categories (id, event_id, name, description, price, max_participants, current_participants)
VALUES
  ('44444444-4444-4444-4444-444444444441', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maratona 42km', 'Percurso completo', 180.00, 3000, 1245),
  ('44444444-4444-4444-4444-444444444442', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Meia Maratona 21km', 'Percurso 21km', 120.00, 2000, 856),
  ('55555555-5555-5555-5555-555555555551', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ironman Individual', 'Individual', 800.00, 1500, 678),
  ('55555555-5555-5555-5555-555555555552', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ironman Revezamento', 'Equipe de 3', 1200.00, 500, 234),
  ('66666666-6666-6666-6666-666666666661', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Percurso 50km', '50km completo', 80.00, 1000, 567),
  ('66666666-6666-6666-6666-666666666662', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Percurso 25km', '25km reduzido', 60.00, 500, 289);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Created: 3 users, 3 events, 6 categories';
    RAISE NOTICE 'Login: organizer1@symplepass.com / password123';
END $$;
