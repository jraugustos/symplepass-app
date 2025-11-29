-- Add Volta Internacional de Curitiba event to the database

-- First, check if the event already exists
DO $$
BEGIN
  -- Only insert if the event doesn't exist
  IF NOT EXISTS (SELECT 1 FROM events WHERE slug = 'volta-curitiba-2025') THEN

    -- Insert the event
    INSERT INTO events (
      id,
      title,
      slug,
      description,
      status,
      sport_type,
      start_date,
      end_date,
      registration_deadline,
      banner_url,
      thumbnail_url,
      location,
      max_participants,
      is_featured,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'Volta Internacional de Curitiba 2025',
      'volta-curitiba-2025',
      'A Volta Internacional de Curitiba é um dos eventos de ciclismo mais tradicionais do Sul do Brasil. Participe desta incrível jornada por paisagens deslumbrantes da capital paranaense! O evento conta com diferentes categorias para atender ciclistas de todos os níveis.',
      'published',
      'ciclismo',
      '2025-03-15 07:00:00',
      '2025-03-15 18:00:00',
      '2025-03-10 23:59:59',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      '{"city": "Curitiba", "state": "PR", "country": "Brasil", "street": "Parque Barigui", "zipCode": "80000-000", "venue": "Parque Barigui - Portão Principal"}'::jsonb,
      1000,
      true,
      now(),
      now()
    );

    -- Get the event ID
    DECLARE
      event_id UUID;
    BEGIN
      SELECT id INTO event_id FROM events WHERE slug = 'volta-curitiba-2025';

      -- Insert categories
      INSERT INTO event_categories (id, event_id, name, description, price, available_slots, max_slots) VALUES
      (gen_random_uuid(), event_id, 'Profissional 100km', 'Percurso completo para ciclistas profissionais e experientes', 350.00, 300, 300),
      (gen_random_uuid(), event_id, 'Amador 70km', 'Percurso intermediário ideal para ciclistas amadores', 250.00, 400, 400),
      (gen_random_uuid(), event_id, 'Light 40km', 'Percurso inicial perfeito para iniciantes no ciclismo', 150.00, 300, 300);

      -- Insert kit items
      INSERT INTO event_kit_items (id, event_id, name, description, display_order) VALUES
      (gen_random_uuid(), event_id, 'Camisa Oficial', 'Camisa técnica DryFit exclusiva do evento', 1),
      (gen_random_uuid(), event_id, 'Número de Peito', 'Identificação do atleta com chip de cronometragem', 2),
      (gen_random_uuid(), event_id, 'Squeeze', 'Garrafa para hidratação de 750ml personalizada', 3),
      (gen_random_uuid(), event_id, 'Medalha Finisher', 'Medalha comemorativa para todos que completarem a prova', 4),
      (gen_random_uuid(), event_id, 'Sacola do Evento', 'Mochila saco personalizada', 5);

      -- Insert course info
      INSERT INTO event_course_info (
        id, event_id, distance, elevation_gain, difficulty, surface_type, description, map_url, support_points
      ) VALUES (
        gen_random_uuid(),
        event_id,
        '100km',
        1200,
        'hard',
        'asfalto',
        'Percurso desafiador passando pelos principais pontos turísticos de Curitiba, incluindo o Jardim Botânico, Parque Tangua, Opera de Arame e diversos parques da cidade. O trajeto combina trechos planos urbanos com subidas desafiadoras.',
        'https://example.com/mapa-percurso',
        ARRAY['Km 20 - Parque Tangua', 'Km 40 - Jardim Botânico', 'Km 60 - Parque Barigui', 'Km 80 - Opera de Arame']
      );

      -- Insert FAQs
      INSERT INTO event_faqs (id, event_id, question, answer, display_order) VALUES
      (gen_random_uuid(), event_id, 'Qual o horário de largada?', 'A largada será às 7h em ponto no Parque Barigui. Recomendamos chegar com pelo menos 1 hora de antecedência.', 1),
      (gen_random_uuid(), event_id, 'Haverá pontos de hidratação?', 'Sim, teremos pontos de hidratação a cada 10km do percurso com água, isotônico e frutas.', 2),
      (gen_random_uuid(), event_id, 'Posso participar com bicicleta elétrica?', 'Não, o evento é exclusivo para bicicletas convencionais sem assistência elétrica.', 3),
      (gen_random_uuid(), event_id, 'Haverá suporte mecânico?', 'Sim, teremos carros de apoio e pontos de suporte mecânico ao longo do percurso.', 4);

      -- Insert regulations
      INSERT INTO event_regulations (id, event_id, title, content, display_order) VALUES
      (gen_random_uuid(), event_id, 'Equipamento Obrigatório', 'Capacete homologado, luvas, óculos de proteção e kit de ferramentas básico.', 1),
      (gen_random_uuid(), event_id, 'Idade Mínima', 'Participantes devem ter no mínimo 16 anos completos no dia do evento.', 2),
      (gen_random_uuid(), event_id, 'Tempo Limite', 'O tempo limite para conclusão da prova é de 8 horas após a largada.', 3);

      -- Insert organizer
      INSERT INTO event_organizers (id, event_id, name, email, phone, website, social_media) VALUES
      (gen_random_uuid(), event_id,
      'Federação Paranaense de Ciclismo', 'contato@fpc.org.br', '(41) 3333-4444',
      'https://fpc.org.br', '{"instagram": "@fpc_oficial", "facebook": "fpcoficial"}'::jsonb);

      -- Insert kit pickup info
      UPDATE events
      SET kit_pickup_info = '{
        "dates": "13 e 14 de março de 2025",
        "hours": "Das 10h às 20h",
        "location": "Shopping Estação - Av. Sete de Setembro, 2775 - Rebouças, Curitiba - PR",
        "notes": "Necessário apresentar documento com foto e comprovante de inscrição"
      }'::jsonb
      WHERE id = event_id;

    END;

    RAISE NOTICE 'Event volta-curitiba-2025 created successfully!';

  ELSE
    RAISE NOTICE 'Event volta-curitiba-2025 already exists, skipping...';
  END IF;
END $$;

-- Refresh the materialized view to include the new event
REFRESH MATERIALIZED VIEW CONCURRENTLY events_with_prices;