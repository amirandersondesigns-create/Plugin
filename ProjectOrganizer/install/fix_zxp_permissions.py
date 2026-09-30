#!/usr/bin/env python3
"""Give every entry in a .zxp normal Unix permissions (dirs 755, files 644).

ZXPSignCmd on Windows (or the Windows build under Wine) writes entries as
"FAT" with no permission bits. macOS then extracts them as mode 000 and
Adobe's installer fails with "status = -160". Only the zip metadata changes;
file bytes, order and compression stay identical, so the signature in
META-INF/signatures.xml remains valid.

Usage: fix_zxp_permissions.py MotionProjectOrganizer.zxp
"""
import os, shutil, sys, tempfile, zipfile

def fix(path):
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zxp", dir=os.path.dirname(os.path.abspath(path)))
    tmp.close()
    with zipfile.ZipFile(path) as src, zipfile.ZipFile(tmp.name, "w") as dst:
        for info in src.infolist():
            data = src.read(info.filename)
            out = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            out.compress_type = info.compress_type
            out.create_system = 3                       # Unix
            is_dir = info.filename.endswith("/")
            out.external_attr = ((0o40755 if is_dir else 0o100644) << 16) | (0x10 if is_dir else 0)
            dst.writestr(out, data)
    shutil.move(tmp.name, path)
    print("Fixed permissions in", path)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    fix(sys.argv[1])
