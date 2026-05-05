"""
Crea el ZIP para itch.io con permisos Unix correctos.
create_system=3 (Unix) + permisos 644/755 aseguran que itch.io
pueda extraer los archivos correctamente en sus servidores Linux/GCS.
"""
import zipfile
import os
import stat

SOURCE_DIR = "itch_final"
OUTPUT_ZIP = "thor_game_itch.zip"

if os.path.exists(OUTPUT_ZIP):
    os.remove(OUTPUT_ZIP)

with zipfile.ZipFile(OUTPUT_ZIP, 'w', zipfile.ZIP_DEFLATED, allowZip64=False) as zf:
    for root, dirs, files in os.walk(SOURCE_DIR):
        # Añadimos entradas explícitas de directorio (necesario para Linux)
        for d in dirs:
            dir_path = os.path.join(root, d)
            arcname = os.path.relpath(dir_path, SOURCE_DIR).replace('\\', '/') + '/'
            zi = zipfile.ZipInfo(arcname)
            zi.create_system = 3          # Unix
            zi.compress_type = zipfile.ZIP_STORED
            zi.flag_bits = 0x800          # UTF-8 filenames
            # Permisos directorio: drwxr-xr-x (755)
            zi.external_attr = (stat.S_IFDIR | 0o755) << 16
            zf.writestr(zi, b'')
            print(f"  DIR  {arcname}")

        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, SOURCE_DIR).replace('\\', '/')
            zi = zipfile.ZipInfo(arcname)
            zi.create_system = 3          # Unix
            zi.compress_type = zipfile.ZIP_DEFLATED
            zi.flag_bits = 0x800          # UTF-8 filenames
            # Permisos archivo: -rw-r--r-- (644)
            zi.external_attr = (stat.S_IFREG | 0o644) << 16

            with open(file_path, 'rb') as f:
                data = f.read()
            zf.writestr(zi, data)
            print(f"  FILE {arcname} ({len(data)} bytes)")

print(f"\nZIP creado: {OUTPUT_ZIP}")
print("Verificando entradas...")
with zipfile.ZipFile(OUTPUT_ZIP, 'r') as zf:
    for info in zf.infolist():
        perms = (info.external_attr >> 16) & 0xFFFF
        print(f"  {info.filename:45s} create_system={info.create_system} perms={oct(perms)}")
print("OK - Listo para subir a itch.io")
