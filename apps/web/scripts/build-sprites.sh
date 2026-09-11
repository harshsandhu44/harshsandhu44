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
EXT="$PACK/Objects/Exterior"
NPCS="$PACK/Character/NPC'S"
PORT="$CHAR/../Portrait/PNG"

[ -d "$PACK" ] || { echo "pack not found: $PACK" >&2; exit 1; }
mkdir -p "$OUT"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# --- farmer: front-facing paper-doll (skin 2 + brown eyes + black hair + blue
#     farm outfit), one row per animation, 32x32 cells -----------------------
# The pack's idle and walk strips both turn the character away to "look
# around" partway through, so each row is cropped to the front-facing run:
# row 0 idle  (4 frames  -- the breathing bob; pack cells 4-15 are the turn)
# row 1 walk  (12 frames -- pack cells 12-23; cells 6-11 are the back walk)
# row 2 reach (16 frames -- "13.3 Carrying - Pick Up", no tool)
compose_anim() { # $1 = anim dir, $2 = crop (or "" for whole strip)  ->  $tmp/row.png
  local d="$CHAR/$1"
  magick "$d/Skins/2.png" \
    "$d/Eyes/Male/Brown.png" -composite \
    "$d/Hair's/Standard/Black.png" -composite \
    "$d/Clothers/Farm/Blue.png" -composite \
    ${2:+-crop "$2" +repage} \
    "$tmp/row.png"
}
compose_anim "1. Idle" "128x32+0+0";          cp "$tmp/row.png" "$tmp/idle.png"
compose_anim "2. Walk" "384x32+384+0";        cp "$tmp/row.png" "$tmp/walk.png"
compose_anim "13.3 Carrying - Pick Up" "";    cp "$tmp/row.png" "$tmp/reach.png"
magick -size 512x96 xc:none -gravity NorthWest \
  "$tmp/idle.png"  -geometry +0+0  -composite \
  "$tmp/walk.png"  -geometry +0+32 -composite \
  "$tmp/reach.png" -geometry +0+64 -composite \
  -strip "$OUT/farmer.png"

# --- NPCs: 4-frame front-facing strips, 32x32 cells (128x32) ----------------
# Same paper-doll idea as the farmer; the pack strips turn away after frame 3
# so each is cropped to the front run. Standing NPCs (neighbour, shopkeeper)
# use their idle strip; the kid paces, so it uses its walk strip.
villager_strip() { # $1 = "1. Idle"|"2. Walk"  $2 = skin  $3 = hair dir  $4 = hair col  $5 = farm col  $6 = crop -> $tmp/npc.png
  local d="$CHAR/$1"
  magick "$d/Skins/$2.png" \
    "$d/Eyes/Male/Brown.png" -composite \
    "$d/Hair's/$3/$4.png" -composite \
    "$d/Clothers/Farm/$5.png" -composite \
    "$d/Acc/Farm.png" -composite \
    -crop "$6" +repage -strip "$tmp/npc.png"
}
# neighbour — skin 3, brown Fawn hair, green outfit, straw hat
villager_strip "1. Idle" 3 Fawn Brown Green "128x32+0+0"
cp "$tmp/npc.png" "$OUT/npc-neighbour.png"

# shopkeeper — premade Gaston chef (16-frame idle, front run 0-3)
magick "$NPCS/Chef/Premade/Gaston/Chef Sprites Idle.png" \
  -crop 128x32+0+0 +repage -strip "$OUT/npc-shopkeeper.png"

# kid — child paper-doll (body 2, Josh brown hair, red shirt), walk front run 0-3
KID="$NPCS/Child/PNG/Walk"
magick "$KID/Body/2.png" \
  "$KID/Body/Eyes.png" -composite \
  "$KID/Hair's/Josh/Brown.png" -composite \
  "$KID/Clothers/Boy/Red.png" -composite \
  -crop 128x32+0+0 +repage -strip "$OUT/npc-kid.png"

# --- NPC dialogue portraits: 64x64, cell (0,0) neutral --------------------
magick "$NPCS/Chef/Premade/Gaston/Chef Portrait.png" \
  -crop 64x64+0+0 +repage -strip "$OUT/portrait-shopkeeper.png"
magick "$PORT/Skins/Male/3.png" \
  "$PORT/Eyes/Brown.png" -composite \
  "$PORT/Hair/Fawn/Brown.png" -composite \
  "$PORT/Clothers/Male/Green.png" -composite \
  "$PORT/Acc/Farm.png" -composite \
  -crop 64x64+0+0 +repage -strip "$OUT/portrait-neighbour.png"
# no child portrait layers in the pack — premade 7 is the youngest neutral face
magick "$PACK/Character/Character/Portrait/Premade/7.png" \
  -crop 64x64+0+0 +repage -strip "$OUT/portrait-kid.png"

# --- buildings: ready-made sprites, trimmed to their opaque bounds -----------
magick "$HOUSES/7.png" -strip "$OUT/house.png"
magick "$HOUSES/Farm Buildings/Barn/Barn.png"           -crop 92x82+0+0   +repage -trim +repage -strip "$OUT/barn.png"
magick "$HOUSES/Farm Buildings/Greenhouse/Greenhouse.png" -crop 80x80+12+7 +repage -trim +repage -strip "$OUT/greenhouse.png"
magick "$HOUSES/Farm Buildings/Silo/Silo.png"           -crop 44x88+0+4   +repage -trim +repage -strip "$OUT/silo.png"
magick "$EXT/Notice Boards.png"                          -crop 32x38+0+0  +repage -trim +repage -strip "$OUT/noticeboard.png"
# mailbox — the pack cell packs TWO mailboxes side by side (16px each); take one
magick "$EXT/Mailbox.png" -crop 16x32+16+0 +repage -trim +repage -strip "$OUT/mailbox.png"
# chest — frame 0 (32x32) is a closed chest (top 16px) over an open one (bottom
# 16px); take the closed top half so the world shows one chest, not two
magick "$EXT/chest.png"   -crop 32x16+0+0  +repage -trim +repage -strip "$OUT/chest.png"

# --- village cottages + shop (decorative backdrop, non-interactive) ---------
# houses 3 / 11 are warm non-winter timber cottages; 10 has a shop awning
magick "$HOUSES/3.png"  -trim +repage -strip "$OUT/cottage-a.png"
magick "$HOUSES/11.png" -trim +repage -strip "$OUT/cottage-b.png"
magick "$HOUSES/10.png" -trim +repage -strip "$OUT/shop.png"

# --- trees: one tree each, picked out of the variant sheets ---------------
magick "$PACK/Objects/Tree/Common/Shadow/Maple Tree.png" -crop 28x34+67+13 +repage -trim +repage -strip "$OUT/tree-maple.png"
magick "$PACK/Objects/Tree/Common/Shadow/Pine Tree.png"  -crop 34x46+90+2  +repage -trim +repage -strip "$OUT/tree-pine.png"

# --- props: single-frame crops out of the pack's strips/sheets -------------
# fountain: top row of 4 spray frames (48x64 cells) — animated in CSS
magick "$EXT/Water fountain.png" -crop 192x64+0+0 +repage -strip "$OUT/fountain.png"
magick "$EXT/Street Lamp 2.png"  -crop 16x48+16+0 +repage -trim +repage -strip "$OUT/lamp.png"
magick "$EXT/Beach/Wooden Bench.png" -crop 32x32+32+0 +repage -trim +repage -strip "$OUT/bench.png"
magick "$EXT/Village Signs.png"  -crop 32x32+0+0  +repage -trim +repage -strip "$OUT/sign.png"
magick "$EXT/Scarescrow.png"     -crop 32x32+0+0  +repage -trim +repage -strip "$OUT/scarecrow.png"
magick "$EXT/shipping box.png"   -crop 18x24+0+10 +repage -trim +repage -strip "$OUT/shipbox.png"
magick "$EXT/Hay Bales.png"      -crop 32x16+0+0  +repage -trim +repage -strip "$OUT/haybale.png"
magick "$EXT/ice cream cart.png" -crop 32x48+0+0  +repage -trim +repage -strip "$OUT/stall.png"
magick "$EXT/Village Barrels.png" -crop 32x32+0+0 +repage -trim +repage -strip "$OUT/barrels.png"
magick "$PACK/Animals/Farm/Chicken/Chicken White.png" -crop 16x16+0+0 +repage -trim +repage -strip "$OUT/chicken.png"

# --- fences: tiling pieces + corner/gate from the wood-fence mini-tilesheet
# (top half of the sheet is the non-snow variant; 16px autotile cells)
FENCEW="$EXT/Fence and Bridge/Fence Wood.png"
magick "$FENCEW" -crop 16x16+48+0 +repage -strip "$OUT/fence-h.png"   # post + 2 rails, tiles L-R
magick "$FENCEW" -crop 16x16+0+16 +repage -strip "$OUT/fence-v.png"   # vertical rail, tiles top-down
# NW corner (rail east + south) — the other 3 corners are this one CSS-mirrored
magick "$FENCEW" -crop 16x16+0+0  +repage -strip "$OUT/fence-corner.png"
# closed double gate, post-leaf-leaf-post, fixed 48x16 — drop in place of a
# 48px run of fence-h to make a gate opening read as a gate, not a bare gap
magick "$FENCEW" -crop 48x16+48+0 +repage -strip "$OUT/fence-gate.png"

# --- path: one plain-brick fill cell out of the path autotile -------------
magick "$PACK/Tileset/Path tiles.png" -crop 16x16+96+32 +repage -strip "$OUT/path.png"

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
magick "$PORT/Skins/Male/2.png" \
  "$PORT/Eyes/Brown.png" -composite \
  "$PORT/Hair/Standart/Black.png" -composite \
  "$PORT/Clothers/Male/Blue.png" -composite \
  -crop 64x64+0+0 +repage -strip "$OUT/portrait.png"

echo "wrote:"
ls -1 "$OUT"
