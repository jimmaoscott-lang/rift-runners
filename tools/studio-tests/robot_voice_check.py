"""Which spoken lines fall back to the computer (robotic) voice? New build served on 8765."""
import asyncio, runpy, os
from playwright.async_api import async_playwright
H_ = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "builder_dials_check.py"), run_name="helpers")
globals().update({k: H_[k] for k in ("NEW","ENGINE","click","start")})
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--autoplay-policy=no-user-gesture-required"])
        pg = await b.new_page(viewport={"width":1366,"height":768})
        await pg.add_init_script("window.__robot=[]; window.__clips=[]; const st=AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start=function(w,o,d){ if(o!==undefined) window.__clips.push([+o.toFixed(2),+(d||0).toFixed(2)]); return st.apply(this,arguments); }; speechSynthesis.speak = u => { window.__robot.push(u.text); u.onend && u.onend(); };")
        async def said(label):
            await pg.wait_for_timeout(2500)
            print(f"{label:28}", "ROBOT: " + str(await pg.evaluate("window.__robot.splice(0)")), "| recorded clips [start, length]:", await pg.evaluate("window.__clips.splice(0)"))
        await pg.goto(NEW, wait_until="networkidle")
        await click(pg, "Jump Straight to Battle"); await pg.wait_for_timeout(3000); await said("battle start")
        await pg.get_by_role("button", name="Hear tutorial step").click(); await said("walkthrough speaker")
        await click(pg, "Skip"); await pg.wait_for_timeout(1500); await pg.evaluate("window.__robot.splice(0); window.__clips.splice(0)")
        await pg.evaluate(ENGINE)
        for power in ("rally","meteor","freeze"):
            await pg.evaluate(f"()=>{{const e=window.__eng; if(e.phase!=='wave') e.startNextWave(); e.powers['{power}']=99; e.castHeroPower('{power}')}}")
            await said("hero power " + power)
        await b.close()
asyncio.run(main())
