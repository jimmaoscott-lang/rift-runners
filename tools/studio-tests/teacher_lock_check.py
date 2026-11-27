import asyncio, re
from playwright.async_api import async_playwright

URL = "http://localhost:8765/rift-runners-studio/"
OUT = "/home/claude/tests/shots"
BANNED = ["Fluent", "Steady", "Guided", "Opening Scene", "Victory Scene", "Defeat Scene", "Preview", "Clear",
          "Unlock All", "Reset Placement", "Load MP4", "Clear All Locks"]

async def texts(page):
    return await page.eval_on_selector_all("button, a, label", "els=>els.filter(e=>e.offsetParent).map(e=>e.innerText.trim().replace(/\\s+/g,' ')).filter(Boolean)")

def hits(ts):
    return sorted({b for t in ts for b in BANNED if b.lower() in t.lower()})

async def open_settings(page):
    await page.locator("button", has_text=re.compile(r"^\s*Settings\s*$")).first.click()
    await page.wait_for_timeout(600)

async def run(W, H, tag):
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        page = await (await b.new_context(viewport={"width": W, "height": H})).new_page()
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        await page.goto(URL, wait_until="networkidle")
        r = {}
        r["title"] = hits(await texts(page))
        await open_settings(page)
        r["settings"] = hits(await texts(page))
        await page.screenshot(path=f"{OUT}/s01_{tag}_settings.png", full_page=True)
        # wrong code
        await page.get_by_role("button", name=re.compile("Teacher Tools")).first.click()
        await page.wait_for_timeout(300)
        inp = page.locator("input[type=password], input[type=text]").last
        await inp.fill("nope123"); await inp.press("Enter"); await page.wait_for_timeout(400)
        body = await page.inner_text("body")
        r["wrong_msg"] = "That code did not work." in body
        r["wrong_badge"] = "Teacher Mode on" in body
        await inp.fill("rift2026"); await inp.press("Enter"); await page.wait_for_timeout(500)
        body = await page.inner_text("body")
        r["right_badge"] = "Teacher Mode on" in body
        r["teacher_settings"] = hits(await texts(page))
        await page.screenshot(path=f"{OUT}/s01_{tag}_teacher.png", full_page=True)
        await page.keyboard.press("Escape"); await page.wait_for_timeout(300)
        for t in ("Close", "Done"):
            l = page.get_by_role("button", name=t, exact=True)
            if await l.count():
                try: await l.first.click(timeout=800)
                except Exception: pass
        r["teacher_title"] = hits(await texts(page))
        await page.reload(wait_until="networkidle")
        body = await page.inner_text("body")
        r["after_reload_badge"] = "Teacher Mode on" in body
        r["after_reload"] = hits(await texts(page))
        # battle, student view
        await page.get_by_role("button", name="Jump Straight to Battle").click()
        await page.wait_for_timeout(1500)
        r["battle"] = hits(await texts(page))
        body = await page.inner_text("body")
        i = body.find("STEP ")
        r["tutorial"] = body[i:i+120].replace("\n", " | ") if i >= 0 else None
        await page.screenshot(path=f"{OUT}/s01_{tag}_battle.png")
        r["errors"] = errs
        await b.close()
        return r

async def main():
    for W, H, tag in ((1366, 768, "big"), (1093, 614, "small")):
        r = await run(W, H, tag)
        print(tag)
        for k, v in r.items(): print("  ", k, v)

asyncio.run(main())
