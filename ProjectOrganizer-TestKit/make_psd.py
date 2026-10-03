# Minimal layered RGB PSD writer (raw channels) — enough for AE to import as a comp.
import struct, sys
def pascal(name):
    b = name.encode("latin-1")[:255]; s = bytes([len(b)]) + b
    while len(s) % 4: s += b"\0"
    return s
def write_psd(path, W, H, layers, bg=(0,0,0)):
    # layers: list of (name, (left, top, right, bottom), (r,g,b,a)), bottom first
    recs, data = b"", b""
    for name, (l, t, r, b), (cr, cg, cb, ca) in layers:
        w, h = r - l, b - t; n = w * h
        planes = [(-1, bytes([ca]) * n), (0, bytes([cr]) * n), (1, bytes([cg]) * n), (2, bytes([cb]) * n)]
        rec = struct.pack(">iiiiH", t, l, b, r, len(planes))
        for cid, px in planes: rec += struct.pack(">hI", cid, 2 + len(px))
        extra = struct.pack(">II", 0, 0) + pascal(name)
        rec += b"8BIMnorm" + bytes([255, 0, 0, 0]) + struct.pack(">I", len(extra)) + extra
        recs += rec
        for cid, px in planes: data += struct.pack(">H", 0) + px
    info = struct.pack(">h", len(layers)) + recs + data
    if len(info) % 2: info += b"\0"
    lmi = struct.pack(">I", len(info)) + info + struct.pack(">I", 0)
    # merged composite
    img = [[list(bg) for _ in range(W)] for _ in range(H)]
    for name, (l, t, r, b), (cr, cg, cb, ca) in layers:
        for y in range(t, b):
            row = img[y]
            for x in range(l, r): row[x] = [cr, cg, cb]
    merged = b"".join(bytes(img[y][x][c] for y in range(H) for x in range(W)) for c in range(3))
    out = b"8BPS" + struct.pack(">H6xHIIHH", 1, 3, H, W, 8, 3)
    out += struct.pack(">I", 0) + struct.pack(">I", 0)
    out += struct.pack(">I", len(lmi)) + lmi
    out += struct.pack(">H", 0) + merged
    open(path, "wb").write(out)
write_psd(sys.argv[1], 640, 360, [
    ("Background", (0, 0, 640, 360), (18, 30, 80, 255)),
    ("Name Bar",  (120, 250, 520, 320), (200, 30, 45, 255)),
    ("Logo",  (24, 24, 124, 124), (250, 200, 40, 255)),
], bg=(18, 30, 80))
