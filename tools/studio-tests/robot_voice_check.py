"""Which spoken lines fall back to the computer (robotic) voice? New build served on 8765."""
import asyncio, runpy, os
from playwright.async_api import async_playwright
H_ = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "builder_dials_check.py"), run_name="helpers")
globals().update({k: H_[k] for k in ("NEW","ENGINE","click","start")})
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--autoplay-policy=no-user-gesture-required"])
        pg = await b.new_page(viewport={"width":1366,"height":768})
        await pg.add_init_script("window.__robot=[]; speechSynthesis.speak = u => { window.__robot.push(u.text); u.onend && u.onend(); };")
        async def said(label):
            await pg.wait_for_timeout(2500)
            print(f"{label:28}", "ROBOT: " + str(await pg.evaluate("window.__robot.splice(0)")))
        await pg.goto(NEW, wait_until="networkidle")
        await click(pg, "Jump Straight to Battle"); await pg.wait_for_timeout(3000); await said("battle start")
        await pg.get_by_role("button", name="Hear tutorial step").click(); await said("walkthrough speaker")
        await click(pg, "Skip"); await pg.evaluate("window.__robot.splice(0)")
        await pg.evaluate(ENGINE)
        for power in ("rally","meteor","freeze"):
            await pg.evaluate(f"()=>{{const e=window.__eng; e.phase='wave'; e.powers['{power}']=99; e.castHeroPower('{power}')}}")
            await said("hero power " + power)
        await b.close()
asyncio.run(main())
