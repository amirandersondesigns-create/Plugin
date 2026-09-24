"""Rewrites a signed ZXP into the canonical layout without touching its
signature (which covers file *contents*, not zip metadata):

- `mimetype` first and stored uncompressed (the UCF/ZXP container rule)
- Unix permissions (dirs 755, files 644, .command/.sh 755) so the extension
  stays readable by After Effects after a system-wide install on macOS.
  ZXPSignCmd run under Wine writes FAT-style entries with owner-only
  permissions.

usage: python3 repack-zxp.py in.zxp out.zxp
"""
import sys
import zipfile

src, dst = sys.argv[1], sys.argv[2]
with zipfile.ZipFile(src) as zin:
    names = zin.namelist()
    order = ["mimetype"] + sorted(n for n in names if n != "mimetype")
    with zipfile.ZipFile(dst, "w") as zout:
        for name in order:
            data = b"" if name.endswith("/") else zin.read(name)
            info = zipfile.ZipInfo(name, date_time=zin.getinfo(name).date_time)
            info.create_system = 3  # Unix
            if name.endswith("/"):
                info.external_attr = (0o40755 << 16) | 0x10
            elif name.endswith((".command", ".sh")):
                info.external_attr = 0o100755 << 16
            else:
                info.external_attr = 0o100644 << 16
            info.compress_type = zipfile.ZIP_STORED if name == "mimetype" else zipfile.ZIP_DEFLATED
            zout.writestr(info, data)
