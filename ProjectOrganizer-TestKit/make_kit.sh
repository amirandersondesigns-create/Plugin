#!/bin/bash
# Builds MPO_TestKit.zip: a deliberately messy "sports job" — media scattered
# across Downloads, a media volume, render folders, Google Earth Studio, etc. —
# plus Build_Test_Project.jsx, which turns it into an After Effects project
# ready for Amir Anderson Project Organizer to clean up.
# Needs: ffmpeg, python3, zip.   Usage: ./make_kit.sh [output_dir]
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$HERE/dist}"
KIT="$OUT/MPO_TestKit"
M="$KIT/Scattered Media"
rm -rf "$KIT" && mkdir -p "$KIT"
ff() { ffmpeg -hide_banner -loglevel error -y "$@"; }
card() { # card <text> <color> <out> — a 640x360 still with a label
    ff -f lavfi -i "color=c=$2:s=640x360" -vf "drawbox=x=20:y=20:w=600:h=320:color=white@0.25:t=4" -frames:v 1 "$3"; }

mkdir -p "$M/Volumes_Media/game7" "$M/Downloads/Other" "$M/Brand" "$M/Audio" "$M/Data" \
         "$M/Renders/crowd_seq" "$M/C4D_renders" "$M/Projects/Google Earth Studio/arena_flyin/footage" \
         "$M/Refs" "$M/Design" "$KIT/Save Here"

echo "Video…"
ff -f lavfi -i testsrc2=s=1280x720:r=29.97:d=4 -f lavfi -i sine=f=440:d=4 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest "$M/Volumes_Media/game7/game7_highlight.mov"
ff -f lavfi -i mandelbrot=s=1280x720:r=29.97 -t 3 -c:v prores_ks -profile:v 0 "$M/Downloads/AdobeStock_998877.mov"

echo "Stills…"
card x "0x552583" "$M/Downloads/Lakers_logo.png"
card x "0x8a5a44" "$M/Downloads/LeBron_headshot.jpg"
card x "0x2e4a3a" "$M/Downloads/GettyImages-1234567.jpg"
card x "0x303a52" "$M/Downloads/arena_wide.tif"
card x "0x1d428a" "$M/Downloads/team_photo.png"
card x "0xc8102e" "$M/Downloads/Other/team_photo.png"     # same name, different file → team_photo_2.png
card x "0x444444" "$M/Refs/opener_styleframe.jpg"

echo "PDF / AI…"
python3 - "$M/Downloads/player stats.pdf" "$M/Brand/league_mark.ai" <<'PY'
import sys
def pdf(text):
    objs = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>"]
    stream = "0.1 0.3 0.8 rg 20 20 360 160 re f BT /F1 28 Tf 1 1 1 rg 40 90 Td (%s) Tj ET" % text
    objs.append("<< /Length %d >>\nstream\n%s\nendstream" % (len(stream), stream))
    objs.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    out, offs = "%PDF-1.4\n", []
    for i, o in enumerate(objs):
        offs.append(len(out)); out += "%d 0 obj\n%s\nendobj\n" % (i + 1, o)
    x = len(out)
    out += "xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1) + "".join("%010d 00000 n \n" % o for o in offs)
    out += "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, x)
    return out.encode("latin-1")
open(sys.argv[1], "wb").write(pdf("PLAYER STATS"))
open(sys.argv[2], "wb").write(pdf("LEAGUE MARK"))   # PDF-compatible .ai
PY

echo "Layered PSD…"
python3 "$HERE/make_psd.py" "$M/Design/scorebug.psd"

echo "Audio…"
ff -f lavfi -i "sine=f=220:d=5" "$M/Audio/VO_intro_take2.wav"
ff -f lavfi -i "anoisesrc=d=1.5:c=pink" -af "afade=t=in:d=0.7,afade=t=out:st=0.8:d=0.7" "$M/Audio/whoosh_03.wav"
ff -f lavfi -i "sine=f=330:d=8" -c:a libmp3lame -b:a 128k "$M/Audio/music_bed.mp3"

echo "Data…"
printf 'team,pts,reb,ast\nLAL,112,44,27\nBOS,108,41,24\n' > "$M/Data/box_score.csv"
printf '{"standings":[{"team":"BOS","w":64,"l":18},{"team":"LAL","w":47,"l":35}]}\n' > "$M/Data/standings.json"

echo "Image sequences…"
ff -f lavfi -i "life=s=640x360:mold=10:r=24:ratio=0.1:death_color=#1a1a2e:life_color=#e94560" -frames:v 24 "$M/Renders/crowd_seq/crowd_%04d.png"
ff -f lavfi -i "gradients=s=640x360:r=24:speed=0.05" -frames:v 12 -pix_fmt gbrpf32le "$M/C4D_renders/trophy_beauty_%04d.exr" 2>/dev/null \
  || ff -f lavfi -i "gradients=s=640x360:r=24:speed=0.05" -frames:v 12 "$M/C4D_renders/trophy_beauty_%04d.exr"
ff -f lavfi -i "cellauto=s=640x360:rule=110:r=24" -frames:v 24 -q:v 3 -start_number 0 "$M/Projects/Google Earth Studio/arena_flyin/footage/arena_flyin_%03d.jpeg"

cp "$HERE/Build_Test_Project.jsx" "$KIT/"
cp "$HERE/README.md" "$KIT/README.md"

(cd "$OUT" && rm -f MPO_TestKit.zip && zip -qr MPO_TestKit.zip MPO_TestKit -x '*.DS_Store')
echo "Built $OUT/MPO_TestKit.zip ($(du -h "$OUT/MPO_TestKit.zip" | cut -f1))"
