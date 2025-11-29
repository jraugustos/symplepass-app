-- Seed data for Symplepass - Brazilian Sports Events Platform
-- Aligned with current database schema

-- Insert test users into auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'organizer1@symplepass.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Paulo Silva"}', false, 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'organizer2@symplepass.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Santos"}', false, 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'user1@symplepass.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jo�o Costa"}', false, 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Insert profiles
INSERT INTO profiles (id, email, full_name, cpf, phone, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'organizer1@symplepass.com', 'Paulo Silva', '123.456.789-01', '+55 11 98765-4321', 'organizer'),
  ('22222222-2222-2222-2222-222222222222', 'organizer2@symplepass.com', 'Maria Santos', '987.654.321-09', '+55 21 98765-4322', 'organizer'),
  ('33333333-3333-3333-3333-333333333333', 'user1@symplepass.com', 'Jo�o Costa', '456.789.123-45', '+55 11 98765-4323', 'user')
ON CONFLICT (id) DO NOTHING;

-- Insert events
INSERT INTO events (id, organizer_id, title, slug, description, sport_type, start_date, end_date, location, banner_url, status, max_participants, registration_start, registration_end, is_featured)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Maratona Internacional de S�o Paulo', 'maratona-sp-2025', 'A maior maratona do Brasil! Percurso de 42km pelas principais avenidas de S�o Paulo.', 'corrida', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days', '{"city": "S�o Paulo", "state": "SP", "venue": "Parque do Ibirapuera"}', 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800', 'published', 5000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '40 days', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Ironman Brasil - Florian�polis', 'ironman-floripa-2025', 'O desafio definitivo do triathlon! Nata��o de 3.8km, ciclismo de 180km e corrida de 42km.', 'triatlo', NOW() + INTERVAL '60 days', NOW() + INTERVAL '60 days', '{"city": "Florian�polis", "state": "SC", "venue": "Praia de Jurer�"}', 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800', 'published', 2000, NOW() - INTERVAL '60 days', NOW() + INTERVAL '50 days', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Volta Cicl�stica de Curitiba', 'volta-curitiba-2025', 'Pedal urbano de 50km pelos parques e ciclovias de Curitiba.', 'ciclismo', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days', '{"city": "Curitiba", "state": "PR", "venue": "Parque Barigui"}', 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800', 'published', 1500, NOW() - INTERVAL '15 days', NOW() + INTERVAL '25 days', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Beach Tennis Open Santos', 'beach-tennis-santos-2025', 'Torneio de Beach Tennis na orla de Santos.', 'outro', NOW() + INTERVAL '15 days', NOW() + INTERVAL '17 days', '{"city": "Santos", "state": "SP", "venue": "Praia do Gonzaga"}', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800', 'published', 200, NOW() - INTERVAL '10 days', NOW() + INTERVAL '10 days', false),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Cross Training Challenge Campinas', 'cross-training-campinas-2025', 'Desafio funcional com 5 provas de alta intensidade.', 'outro', NOW() + INTERVAL '20 days', NOW() + INTERVAL '20 days', '{"city": "Campinas", "state": "SP", "venue": "Arena Cross Fit"}', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800', 'published', 300, NOW() - INTERVAL '5 days', NOW() + INTERVAL '15 days', false),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '11111111-1111-1111-1111-111111111111', 'Corrida de Montanha Serra da Mantiqueira', 'trail-run-mantiqueira-2025', 'Trail running em altitude! Percursos de 10km, 21km e 42km.', 'corrida', NOW() + INTERVAL '35 days', NOW() + INTERVAL '35 days', '{"city": "Campos do Jord�o", "state": "SP", "venue": "Parque Estadual"}', 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800', 'published', 800, NOW() - INTERVAL '20 days', NOW() + INTERVAL '30 days', false),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'Triathlon Sprint Guaruj�', 'tri-sprint-guaruja-2025', 'Triathlon Sprint ideal para iniciantes: 750m nata��o, 20km bike e 5km corrida.', 'triatlo', NOW() + INTERVAL '50 days', NOW() + INTERVAL '50 days', '{"city": "Guaruj�", "state": "SP", "venue": "Praia da Enseada"}', 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800', 'published', 500, NOW() - INTERVAL '25 days', NOW() + INTERVAL '45 days', false),
  ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', 'Caminhada Ecol�gica Parque Ibirapuera', 'caminhada-ibirapuera-2025', 'Caminhada de 5km pelo Parque Ibirapuera com guia especializado.', 'caminhada', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days', '{"city": "S�o Paulo", "state": "SP", "venue": "Parque do Ibirapuera"}', 'https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800', 'published', 100, NOW() - INTERVAL '5 days', NOW() + INTERVAL '8 days', false),
  ('99999999-9999-9999-9999-999999999999', '22222222-2222-2222-2222-222222222222', 'Corrida da Praia do Leme', 'corrida-leme-rj-2025', 'Corrida de 10km pela orla de Copacabana e Leme.', 'corrida', NOW() + INTERVAL '25 days', NOW() + INTERVAL '25 days', '{"city": "Rio de Janeiro", "state": "RJ", "venue": "Praia do Leme"}', 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800', 'published', 1000, NOW() - INTERVAL '15 days', NOW() + INTERVAL '20 days', false),
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Nata��o em �guas Abertas', 'natacao-guanabara-2025', 'Travessia de 3km na Ba�a de Guanabara.', 'natacao', NOW() + INTERVAL '40 days', NOW() + INTERVAL '40 days', '{"city": "Rio de Janeiro", "state": "RJ", "venue": "Marina da Gl�ria"}', 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800', 'published', 600, NOW() - INTERVAL '20 days', NOW() + INTERVAL '35 days', false);

-- Insert event categories
INSERT INTO event_categories (id, event_id, name, description, price, max_participants, current_participants)
VALUES
  ('cat-aaaa-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Maratona 42km', 'Percurso completo', 180.00, 3000, 1245),
  ('cat-aaaa-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Meia Maratona 21km', 'Percurso 21km', 120.00, 2000, 856),
  ('cat-bbbb-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ironman Individual', 'Individual', 800.00, 1500, 678),
  ('cat-bbbb-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Ironman Revezamento', 'Equipe de 3', 1200.00, 500, 234),
  ('cat-cccc-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Percurso 50km', '50km completo', 80.00, 1000, 567),
  ('cat-cccc-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Percurso 25km', '25km reduzido', 60.00, 500, 289),
  ('cat-dddd-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Iniciante', 'Iniciante', 150.00, 80, 34),
  ('cat-dddd-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Avan�ado', 'Avan�ado', 200.00, 120, 67),
  ('cat-eeee-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'RX Elite', 'Elite', 120.00, 100, 45),
  ('cat-eeee-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Scaled', 'Scaled', 100.00, 200, 89),
  ('cat-ffff-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Ultra 42km', '42km', 200.00, 300, 123),
  ('cat-ffff-2222-2222-2222-222222222222', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Trail 21km', '21km', 150.00, 300, 167),
  ('cat-ffff-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Trail 10km', '10km', 100.00, 200, 98),
  ('cat-7777-1111-1111-1111-111111111111', '77777777-7777-7777-7777-777777777777', 'Individual', 'Individual', 180.00, 400, 156),
  ('cat-7777-2222-2222-2222-222222222222', '77777777-7777-7777-7777-777777777777', 'Duplas', 'Duplas', 300.00, 100, 45),
  ('cat-8888-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', 'Geral', 'Geral', 40.00, 100, 67),
  ('cat-9999-1111-1111-1111-111111111111', '99999999-9999-9999-9999-999999999999', '10km', '10km', 90.00, 1000, 234),
  ('cat-a111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', '3km', '3km', 120.00, 600, 156);

-- Success message
DO $$
BEGIN
    RAISE NOTICE ' Seed data inserted successfully!';
    RAISE NOTICE '=� Created: 3 users, 10 events, 18 categories';
    RAISE NOTICE '= Login: organizer1@symplepass.com / password123';
END $$;