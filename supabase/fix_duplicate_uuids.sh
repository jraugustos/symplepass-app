#!/bin/bash

# Fix duplicate UUIDs in seed.sql
# The issue is that some UUIDs are reused for different events

sed -i '' \
  -e "271s/'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'/'a1111111-1111-1111-1111-111111111111'/g" \
  -e "290s/'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'/'a2222222-2222-2222-2222-222222222222'/g" \
  -e "310s/'cccccccc-1111-1111-1111-cccccccccccc'/'a3333333-3333-3333-3333-333333333333'/g" \
  -e "330s/'dddddddd-dddd-dddd-dddd-dddddddddddd'/'a4444444-4444-4444-4444-444444444444'/g" \
  -e "350s/'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'/'a5555555-5555-5555-5555-555555555555'/g" \
  seed.sql

# Also fix the corresponding category references
sed -i '' \
  -e "s/'cat-aaaj-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'/'cat-aaaj-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'/g" \
  -e "s/'cat-bbbk-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'/'cat-bbbk-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222'/g" \
  -e "s/'cat-bbbk-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'/'cat-bbbk-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222'/g" \
  -e "s/'cat-cccl-1111-1111-1111-111111111111', 'cccccccc-1111-1111-1111-cccccccccccc'/'cat-cccl-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333'/g" \
  -e "s/'cat-cccl-2222-2222-2222-222222222222', 'cccccccc-1111-1111-1111-cccccccccccc'/'cat-cccl-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333'/g" \
  -e "s/'cat-dddm-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd'/'cat-dddm-1111-1111-1111-111111111111', 'a4444444-4444-4444-4444-444444444444'/g" \
  -e "s/'cat-dddm-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd'/'cat-dddm-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444'/g" \
  -e "s/'cat-eeen-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'/'cat-eeen-1111-1111-1111-111111111111', 'a5555555-5555-5555-5555-555555555555'/g" \
  -e "s/'cat-eeen-2222-2222-2222-222222222222', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'/'cat-eeen-2222-2222-2222-222222222222', 'a5555555-5555-5555-5555-555555555555'/g" \
  seed.sql

echo "Duplicate UUIDs fixed!"
