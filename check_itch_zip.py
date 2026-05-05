import zipfile
from pathlib import Path

ZIP_PATH = "thor_game_itch.zip"

expected = [
    "index.html",
    "game.js",
    "style.css",
    "assets/thor.png",
    "assets/enemy.png",
    "assets/enemy2.png",
    "assets/enemy3.png",
    "assets/loki.png",
    "assets/loki_cabras.png",
    "assets/bird_blue.png",
    "assets/bird_white.png",
    "assets/apolo.png",
    "assets/artemisa.png",
    "assets/cancion_thor.mp3",
    "assets/intro.mp4",
]

with zipfile.ZipFile(ZIP_PATH, "r") as z:
    names = z.namelist()

    print("=== Entradas reales del ZIP ===")
    for name in names:
        info = z.getinfo(name)
        print(repr(name), info.file_size, "bytes")

    print("\n=== Comprobación exacta ===")
    names_set = set(names)

    for file in expected:
        if file in names_set:
            print("OK     ", file)
        else:
            print("FALTA  ", file)

            matches = [
                n for n in names
                if n.lower().replace("\\", "/") == file.lower()
            ]

            if matches:
                print("       Parecidos encontrados:", matches)

    print("\n=== Posibles problemas ===")

    for name in names:
        if "\\" in name:
            print("BACKSLASH EN RUTA:", repr(name))

        if name.startswith("/"):
            print("RUTA ABSOLUTA:", repr(name))

        if name != name.strip():
            print("ESPACIOS AL PRINCIPIO/FINAL:", repr(name))

        if len(name) > 240:
            print("RUTA DEMASIADO LARGA:", len(name), repr(name))

    total_size = sum(z.getinfo(n).file_size for n in names)

    print("\nTotal archivos:", len(names))
    print("Tamaño extraído total:", round(total_size / 1024 / 1024, 2), "MB")

    for name in names:
        size_mb = z.getinfo(name).file_size / 1024 / 1024
        if size_mb > 200:
            print("ARCHIVO > 200 MB:", name, round(size_mb, 2), "MB")

    if len(names) > 1000:
        print("DEMASIADOS ARCHIVOS:", len(names))

    if total_size > 500 * 1024 * 1024:
        print("ZIP EXTRAÍDO > 500 MB")