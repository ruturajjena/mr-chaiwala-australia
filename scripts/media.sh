#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  Mr. Chaiwala — media pipeline
#
#  Every clip on this site is SCRUBBED, never played. The scroll position sets
#  `currentTime` directly, which means the encoder's first job is to make any
#  frame reachable quickly, forwards or backwards.
#
#  THE STANDARD LADDER (every clip, .desktop / .mobile)
#  keyint=1: every frame is an IDR, every seek is O(1), reverse scrubbing costs
#  exactly the same as forward. The trade is file size, bought back by dropping
#  to 12fps and a modest resolution. Right for plates that sit inside a layout
#  (menu page category plates, section backgrounds, effect overlays).
#
#  THE HERO RUNG (product clips only, .hd / .hd-mobile)
#  The hero theatre draws its plate at ~2400 device pixels on a 2x laptop, so
#  the standard 960x540 clip was stretched 2.5x and looked soft. All-intra at
#  full resolution would cost ~12MB a clip — more than the master itself — for
#  no visible gain. Measured on the hardest clip (Masala Maggi), centre-crop
#  VMAF against the master:
#
#     960x540  12fps all-intra CRF29   1.8MB   VMAF 37.5   (old)
#    1920x1080 24fps all-intra CRF23  12.4MB   VMAF 67.6
#    1920x1080 24fps GOP-12   CRF23    6.6MB   VMAF 68.4
#    1920x1080 24fps GOP-12   CRF25    5.2MB   VMAF 67.6
#    1280x720  24fps GOP-12   CRF23    3.7MB   VMAF 64.9
#
#  So: full resolution, all 24 frames, a keyframe every 12 frames, no B-frames.
#  Seek cost into the middle of a GOP measured ~6ms median / ~9ms p95 in Chrome,
#  forwards and backwards alike — inside one display frame. GOP-24 pushed p95 to
#  13ms, so 12 is the ceiling. src/lib/scrub.ts must not use fastSeek on these
#  (it snaps to keyframes); the Seeker's `intra: false` option handles that.
#
#  THE PORTRAIT RUNG (spice only, .portrait)
#  Crafted Fresh draws the spice clip in a fixed 4:5 box with object-fit: cover,
#  which only ever shows the centre 4:5 of the frame. So exactly that crop is
#  encoded at the master's full 1080 lines: 864x1080, 24fps, GOP-12. Same seek
#  characteristics as the hero rung. The .desktop/.mobile spice files stay for
#  the hero's effect overlay, which is masked and blended and needs no detail.
#
#  The generator ✦ watermark at (1694,852)–(1816,944) is removed with `delogo`
#  rather than a crop, so the full 1920x1080 composition survives.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$ROOT/assets/videos"
OUT_V="$ROOT/public/media/video"
OUT_P="$ROOT/public/media/poster"
DELOGO="delogo=x=1694:y=852:w=122:h=92"
FPS=12
# All-intra. bframes=0 because a B-frame depends on a *future* frame.
INTRA="keyint=1:min-keyint=1:scenecut=0:bframes=0"
# Hero and portrait rungs. See the notes above.
HERO_FPS=24
HERO_GOP="keyint=12:min-keyint=12:scenecut=0:bframes=0"
# Centre 4:5 of a 1920x1080 frame.
PORTRAIT_CROP="crop=864:1080:528:0"

mkdir -p "$OUT_V" "$OUT_P"

# slug | source | role | poster-timestamp | optional trim start:end
#
# Poster timestamps are the clip's FIRST frame, not a flattering mid-clip one.
# A poster is what shows before a clip is attached, and every clip here is
# scrubbed from its start — so any other timestamp makes the plate visibly jump
# the moment the video takes over. (The social/OG still is generated separately
# and can be as pretty as it likes.)
MANIFEST=(
  "signature-chai|Signature Chai (hero).mp4|product|0.042"
  "kitkat-shake|KitKat Shake.mp4|product|0.042"
  "vada-pav|Vada Pav.mp4|product|0.042"
  "paneer-sandwich|Paneer Tandoori Sandwich.mp4|product|0.042"
  "pasta|Pasta.mp4|product|0.042"
  "masala-maggi|Masala Maggi.mp4|product|0.042"
  "stuffed-paratha|Stuffed Paratha.mp4|product|0.042"
  "chaat|Chaat.mp4|product|0.042"
  "steam|Steam Loop.mp4|effect|0.042"
  "spice|Spice Library.mp4|effect|0.042"
  "splash|Liquid Splash Library.mp4|effect|0.042"
  "ingredients|Falling Ingredients.mp4|effect|0.042"
  # The master opens on a boiling pot; only the back half is the street
  # exterior we want.
  "night-cafe|Night Café Atmosphere.mp4|ambient|0.042|3.6:8.0"
)

encode_one() {
  local slug="$1" file="$2" role="$3" pts="$4" trim="${5:-}"
  local in="$SRC/$file"
  [ -f "$in" ] || { echo "  !! missing $file"; return 1; }

  local cut=()
  [ -n "$trim" ] && cut=(-ss "${trim%%:*}" -to "${trim##*:}")

  local dcrf dw mcrf mw
  case "$role" in
    # Product clips at layout size (menu page). The hero uses the rung below.
    product) dcrf=29; dw="960:540";  mcrf=31; mw="640:360" ;;
    # Overlays: heavily masked, blended and rarely in focus.
    effect)  dcrf=31; dw="800:450";  mcrf=33; mw="512:288" ;;
    # Section background, seen behind a heavy scrim.
    ambient) dcrf=30; dw="960:540";  mcrf=32; mw="640:360" ;;
  esac

  ffmpeg -nostdin -y -v error "${cut[@]}" -i "$in" -an \
    -vf "$DELOGO,fps=$FPS,scale=$dw:flags=lanczos" \
    -c:v libx264 -preset slow -crf "$dcrf" -x264-params "$INTRA" \
    -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart \
    "$OUT_V/$slug.desktop.mp4"

  ffmpeg -nostdin -y -v error "${cut[@]}" -i "$in" -an \
    -vf "$DELOGO,fps=$FPS,scale=$mw:flags=lanczos" \
    -c:v libx264 -preset slow -crf "$mcrf" -x264-params "$INTRA" \
    -pix_fmt yuv420p -profile:v main -level 3.1 -movflags +faststart \
    "$OUT_V/$slug.mobile.mp4"

  if [ "$role" = product ]; then
    # Hero rung — full-resolution desktop, 720p for phones.
    ffmpeg -nostdin -y -v error "${cut[@]}" -i "$in" -an \
      -vf "$DELOGO,fps=$HERO_FPS,scale=1920:1080:flags=lanczos" \
      -c:v libx264 -preset slow -tune film -crf 24 -x264-params "$HERO_GOP" \
      -pix_fmt yuv420p -profile:v high -level 4.1 -movflags +faststart \
      "$OUT_V/$slug.hd.mp4"

    ffmpeg -nostdin -y -v error "${cut[@]}" -i "$in" -an \
      -vf "$DELOGO,fps=$HERO_FPS,scale=1280:720:flags=lanczos" \
      -c:v libx264 -preset slow -tune film -crf 23 -x264-params "$HERO_GOP" \
      -pix_fmt yuv420p -profile:v high -level 3.2 -movflags +faststart \
      "$OUT_V/$slug.hd-mobile.mp4"
  fi

  if [ "$slug" = spice ]; then
    # Portrait rung — the 4:5 crop Crafted Fresh's plate shows, at native res.
    ffmpeg -nostdin -y -v error "${cut[@]}" -i "$in" -an \
      -vf "$DELOGO,fps=$HERO_FPS,$PORTRAIT_CROP" \
      -c:v libx264 -preset slow -tune film -crf 22 -x264-params "$HERO_GOP" \
      -pix_fmt yuv420p -profile:v high -level 4.0 -movflags +faststart \
      "$OUT_V/$slug.portrait.mp4"
  fi

  # Poster: the frame the plate rests on before its clip is attached.
  local tmp="$OUT_P/.$slug.png"
  ffmpeg -nostdin -y -v error -ss "$pts" -i "$in" -vf "$DELOGO,scale=1280:720:flags=lanczos" -frames:v 1 "$tmp"
  cwebp -quiet -q 74 -m 6 "$tmp" -o "$OUT_P/$slug.webp"
  rm -f "$tmp"

  echo "  ✓ $slug"
}
export -f encode_one
export SRC OUT_V OUT_P DELOGO FPS INTRA HERO_FPS HERO_GOP PORTRAIT_CROP

echo "Encoding ${#MANIFEST[@]} clips (standard ladder + hero and portrait rungs)…"
printf '%s\n' "${MANIFEST[@]}" \
  | xargs -P 4 -I{} bash -c 'IFS="|" read -r a b c d e <<< "{}"; encode_one "$a" "$b" "$c" "$d" "$e"'

echo
du -sh "$OUT_V" "$OUT_P"
