#!/bin/bash
# Fix invalid UUIDs in seed.sql (letters g-z are not valid hex digits)

cp seed.sql seed.sql.backup

sed -i '' \
  -e "s/gggggggg-gggg-gggg-gggg-gggggggggggg/77777777-7777-7777-7777-777777777777/g" \
  -e "s/hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh/88888888-8888-8888-8888-888888888888/g" \
  -e "s/iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii/99999999-9999-9999-9999-999999999999/g" \
  -e "s/jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/g" \
  -e "s/kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/g" \
  -e "s/llllllll-llll-llll-llll-llllllllllll/cccccccc-1111-1111-1111-cccccccccccc/g" \
  -e "s/mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm/dddddddd-dddd-dddd-dddd-dddddddddddd/g" \
  -e "s/nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/g" \
  -e "s/oooooooo-oooo-oooo-oooo-oooooooooooo/f0000000-0000-0000-0000-000000000000/g" \
  -e "s/pppppppp-pppp-pppp-pppp-pppppppppppp/f1111111-1111-1111-1111-111111111111/g" \
  -e "s/qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq/f2222222-2222-2222-2222-222222222222/g" \
  -e "s/rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr/f3333333-3333-3333-3333-333333333333/g" \
  -e "s/ssssssss-ssss-ssss-ssss-ssssssssssss/f4444444-4444-4444-4444-444444444444/g" \
  -e "s/tttttttt-tttt-tttt-tttt-tttttttttttt/f5555555-5555-5555-5555-555555555555/g" \
  -e "s/uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu/f6666666-6666-6666-6666-666666666666/g" \
  -e "s/vvvvvvvv-vvvv-vvvv-vvvv-vvvvvvvvvvvv/f7777777-7777-7777-7777-777777777777/g" \
  -e "s/wwwwwwww-wwww-wwww-wwww-wwwwwwwwwwww/f8888888-8888-8888-8888-888888888888/g" \
  -e "s/cat-gggg/cat-7777/g" \
  -e "s/cat-hhhh/cat-8888/g" \
  -e "s/cat-iiii/cat-9999/g" \
  -e "s/cat-jjjj/cat-aaaj/g" \
  -e "s/cat-kkkk/cat-bbbk/g" \
  -e "s/cat-llll/cat-cccl/g" \
  -e "s/cat-mmmm/cat-dddm/g" \
  -e "s/cat-nnnn/cat-eeen/g" \
  -e "s/cat-oooo/cat-f000/g" \
  -e "s/cat-pppp/cat-f111/g" \
  -e "s/cat-qqqq/cat-f222/g" \
  -e "s/cat-rrrr/cat-f333/g" \
  -e "s/cat-ssss/cat-f444/g" \
  -e "s/cat-tttt/cat-f555/g" \
  -e "s/cat-uuuu/cat-f666/g" \
  -e "s/cat-vvvv/cat-f777/g" \
  -e "s/cat-wwww/cat-f888/g" \
  -e "s/kit-gggg/kit-7777/g" \
  -e "s/course-gggg/course-7777/g" \
  -e "s/faq-gggg/faq-7777/g" \
  -e "s/reg-gggg/reg-7777/g" \
  seed.sql

echo "UUIDs fixed!"
