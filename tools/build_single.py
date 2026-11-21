"""Build the all-in-one game file.

Packs the game code, Phaser, fonts, text and voice files into ONE html file that runs
with no other files and no internet (tap mode). Outputs:

- dist/rift-runners-offline.html  (open straight from a laptop or flash drive)
- dist/apps-script/index.html  (same file, for a Google Apps Script web app)
- dist/apps-script/Code.gs     (the small Apps Script that serves it)

Run: python3 tools/build_single.py
"""
import base64
import json
import os
import re
import shutil
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
GAME = os.path.join(ROOT, "game")
DIST = os.path.join(ROOT, "dist")


def read(path, mode="r"):
    with open(path, mode, **({} if "b" in mode else {"encoding": "utf-8"})) as f:
        return f.read()


def data_uri(path, mime):
    return f"data:{mime};base64," + base64.b64encode(read(path, "rb")).decode("ascii")


def safe_script(js):
    # A literal "</script" inside a script would end the tag early.
    return js.replace("</script", "<\\/script")


def main():
    html = read(os.path.join(GAME, "index.html"))

    # Fonts -> data URIs
    def font_sub(m):
        rel = m.group(1)
        path = os.path.normpath(os.path.join(GAME, rel))
        return f"url('{data_uri(path, 'font/woff2')}')"
    html = re.sub(r"url\('([^']+\.woff2)'\)", font_sub, html)

    # Content and voice files
    inline = {"json": {}, "files": {}}
    inline["json"]["data/strings.json"] = json.loads(read(os.path.join(GAME, "data", "strings.json")))
    manifest_rel = "../assets/audio/ui/manifest.json"
    manifest_path = os.path.normpath(os.path.join(GAME, manifest_rel))
    if os.path.exists(manifest_path):
        manifest = json.loads(read(manifest_path))
        inline["json"][manifest_rel] = manifest
        for lang_files in manifest.values():
            for name in lang_files.values():
                rel = "../assets/audio/ui/" + name
                path = os.path.normpath(os.path.join(GAME, rel))
                if os.path.exists(path):
                    inline["files"][rel] = data_uri(path, "audio/mpeg")

    # Scripts -> inline
    block = re.search(r"<!-- BUILD:SCRIPTS -->(.*?)<!-- /BUILD:SCRIPTS -->", html, re.S)
    if not block:
        print("BUILD:SCRIPTS markers not found in game/index.html")
        return 1
    parts = ["<script>window.RF_INLINE = " + safe_script(json.dumps(inline, ensure_ascii=False)) + ";</script>"]
    for src in re.findall(r'<script src="([^"]+)"></script>', block.group(1)):
        parts.append("<script>\n" + safe_script(read(os.path.join(GAME, src))) + "\n</script>")
    html = html[:block.start()] + "\n".join(parts) + html[block.end():]

    os.makedirs(os.path.join(DIST, "apps-script"), exist_ok=True)
    for out in [os.path.join(DIST, "rift-runners-offline.html"), os.path.join(DIST, "apps-script", "index.html")]:
        with open(out, "w", encoding="utf-8") as f:
            f.write(html)
    shutil.copy(os.path.join(ROOT, "tools", "apps-script", "Code.gs"), os.path.join(DIST, "apps-script", "Code.gs"))
    size_kb = len(html.encode("utf-8")) // 1024
    print(f"Built dist/rift-runners-offline.html and dist/apps-script/ ({size_kb} KB, {len(inline['files'])} voice files).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
