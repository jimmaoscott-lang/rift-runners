import asyncio, time, os, sys
from playwright.async_api import async_playwright

URL = "http://localhost:8765/rift-runners-studio/"
OUT = "/home/claude/tests/shots"
W, H = int(sys.argv[1]) if len(sys.argv) > 1 else 1366, int(sys.argv[2]) if len(sys.argv) > 2 else 768
TAG = sys.argv[3] if len(sys.argv) > 3 else "b"

async def dump(page, name):
    await page.screenshot(path=f"{OUT}/{TAG}_{name}.png")
    btns = await page.eval_on_selector_all("button", "els=>els.filter(e=>e.offsetParent).map(e=>e.innerText.trim().replace(/\\s+/g,' ')).filter(Boolean)")
    print(f"--- {name} buttons:", btns[:80])

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome",
                                    args=["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required", "--enable-unsafe-swiftshader"])
        ctx = await b.new_context(viewport={"width": W, "height": H}, permissions=["microphone"])
        page = await ctx.new_page()
        logs = []
        page.on("console", lambda m: logs.append(f"[{m.type}] {m.text}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: logs.append(f"[PAGEERROR] {e}"))
        await page.goto(URL, wait_until="networkidle")
        await page.get_by_role("button", name="Jump Straight to Battle").click()
        await page.wait_for_timeout(2500)
        await dump(page, "02_battle")
        txt = await page.inner_text("body")
        print("BATTLE TEXT:\n", txt[:3000])
        # fps probe
        fps = await page.evaluate("""() => new Promise(r=>{let n=0;const t0=performance.now();function f(){n++; if(performance.now()-t0<3000) requestAnimationFrame(f); else r(n/3);} requestAnimationFrame(f);})""")
        print("FPS (headless, software):", round(fps, 1))
        print("\nCONSOLE:", "\n".join(logs[:40]))
        await b.close()

asyncio.run(main())
