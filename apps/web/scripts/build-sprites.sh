#!/usr/bin/env bash
# Regenerate apps/web/public/sprites/ from the Farm RPG - Tiny Asset Pack.
#
# The pack (by EmanuelleDev, emanuelledev.itch.io) is NOT vendored — it lives in
# ~/Downloads. This script composites the pieces the pixel-farm portfolio uses
# into a handful of committed PNGs. Re-run it if you change which pack pieces
# the farm uses; otherwise the committed output is the source of truth.
#
# Requires ImageMagick 7 (`magick`). Run from anywhere:
#   apps/web/scripts/build-sprites.sh
set -euo pipefail

PACK="${FARM_PACK:-$HOME/Downloads/Farm RPG - Tiny Asset Pack - (All in One)}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/sprites"
CHAR="$PACK/Character/Character/PNG"
HOUSES="$PACK/Objects/Exterior/Houses"

[ -d "$PACK" ] || { echo "pack not found: $PACK" >&2; exit 1; }
mkdir -p "$OUT"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# --- farmer: front-facing paper-doll (skin 2 + brown eyes + black hair + blue
#     farm outfit), one row per animation, 32x32 cells -----------------------
# row 0 idle  (16 frames, 512 wide)
# row 1 walk  (24 frames, 768 wide)
# row 2 reach (16 frames, 512 wide  -- "13.3 Carrying - Pick Up", no tool)
compose_anim() { # $1 = anim dir name  ->  $tmp/row.png
  local d="$CHAR/$1"
  magick "$d/Skins/2.png" \
    "$d/Eyes/Male/Brown.png" -composite \
    "$d/Hair's/Standard/Black.png" -composite \
    "$d/Clothers/Farm/Blue.png" -composite \
    "$tmp/row.png"
}
compose_anim "1. Idle";                     cp "$tmp/row.png" "$tmp/idle.png"
compose_anim "2. Walk";                     cp "$tmp/row.png" "$tmp/walk.png"
compose_anim "13.3 Carrying - Pick Up";     cp "$tmp/row.png" "$tmp/reach.png"
magick -size 768x96 xc:none -gravity NorthWest \
  "$tmp/idle.png"  -geometry +0+0  -composite \
  "$tmp/walk.png"  -geometry +0+32 -composite \
  "$tmp/reach.png" -geometry +0+64 -composite \
  -strip "$OUT/farmer.png"

# --- buildings: ready-made sprites, trimmed to their opaque bounds -----------
magick "$HOUSES/7.png" -strip "$OUT/house.png"
magick "$HOUSES/Farm Buildings/Barn/Barn.png"           -crop 92x82+0+0   +repage -trim +repage -strip "$OUT/barn.png"
magick "$HOUSES/Farm Buildings/Greenhouse/Greenhouse.png" -crop 80x80+12+7 +repage -trim +repage -strip "$OUT/greenhouse.png"
magick "$HOUSES/Farm Buildings/Silo/Silo.png"           -crop 44x88+0+4   +repage -trim +repage -strip "$OUT/silo.png"
magick "$PACK/Objects/Exterior/Mailbox.png"             -strip "$OUT/mailbox.png"
magick "$PACK/Objects/Exterior/chest.png"               -crop 32x32+0+0 +repage -strip "$OUT/chest.png"
magick "$PACK/Objects/Exterior/Notice Boards.png"       -crop 32x38+0+0 +repage -trim +repage -strip "$OUT/noticeboard.png"

# --- trees: one tree each, picked out of the variant sheets ---------------
magick "$PACK/Objects/Tree/Common/Shadow/Maple Tree.png" -crop 28x34+67+13 +repage -trim +repage -strip "$OUT/tree-maple.png"
magick "$PACK/Objects/Tree/Common/Shadow/Pine Tree.png"  -crop 34x46+90+2  +repage -trim +repage -strip "$OUT/tree-pine.png"

# --- ground -------------------------------------------------------------
# The pack's grass tilesets are all decorative clumps/hedges with no clean
# fill tile, so the base ground is a generated 16x16 tile in the pack's grass
# green (#7EC433) with a few darker/lighter specks for texture.
magick -size 16x16 xc:"#7ec433" -strip \
  -fill "#74b92b" -draw "point 2,4 point 9,2 point 13,7 point 5,11 point 11,13" \
  -fill "#8ad04a" -draw "point 6,6 point 3,9 point 12,3 point 8,12 point 14,10" \
  "$OUT/grass.png"

# --- dialogue UI: 9-slice panel + speaker portrait ----------------------
magick "$PACK/UI/dialogue box.png" -crop 48x47+0+49 +repage -trim +repage -strip "$OUT/ui-panel.png"
# same paper-doll as the sprite (skin 2 / brown eyes / black hair / blue),
# from the 5x3 expression grid -- cell (0,0) is the neutral face
PORT="$CHAR/../Portrait/PNG"
magick "$PORT/Skins/Male/2.png" \
  "$PORT/Eyes/Brown.png" -composite \
  "$PORT/Hair/Standart/Black.png" -composite \
  "$PORT/Clothers/Male/Blue.png" -composite \
  -crop 64x64+0+0 +repage -strip "$OUT/portrait.png"

echo "wrote:"
ls -1 "$OUT"
