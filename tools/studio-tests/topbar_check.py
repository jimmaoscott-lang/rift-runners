"""S-03 check: battle top bar overlap, clipping, size and rows. New build on 8765, pre-change on 8766."""
import asyncio, re, json, runpy, os
from playwright.async_api import async_playwright
H_ = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), "builder_dials_check.py"), run_name="helpers")
globals().update({k: H_[k] for k in ("NEW","OLD","OUT","ENGINE","click","open_settings","enter_code","close_settings","start")})

MEASURE = r"""() => {
  const pause = document.querySelector('button[aria-label="Pause"],button[aria-label="Resume"]');
  let col = pause; while (col && !(col.className||'').toString().includes('overflow-hidden')) col = col.parentElement;
  const area = col.getBoundingClientRect();
  const stop = document.querySelector('button[aria-label="Stop Game and Return to Title"]');
  let bar = pause.parentElement; while (!bar.contains(document.querySelector('[title="Rune Crystals"]'))) bar = bar.parentElement;
  const items = [...bar.querySelectorAll('button,[title="Rune Crystals"]')].map(e => { const r = e.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
    return {name:(e.getAttribute('aria-label')||e.innerText||e.title).trim().replace(/\s+/g,' ').slice(0,28), x:Math.round(r.x), y:Math.round(r.y), w:Math.round(r.width), h:Math.round(r.height),
      covered: !(hit && (e.contains(hit)||hit.contains(e))), clipped: r.left < area.left-0.5 || r.right > area.right+0.5 || e.scrollWidth > e.clientWidth+1}; });
  const over = [];
  for (let i=0;i<items.length;i++) for (let j=i+1;j<items.length;j++) { const a=items[i], b=items[j];
    if (Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x) > 1 && Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y) > 1) over.push([a.name,b.name]); }
  const br = bar.getBoundingClientRect();
  return {area: Math.round(area.width), barH: Math.round(br.height), items, over};
}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        for W, H in ((1024,576),(1093,614),(1199,700),(1200,700),(1366,768),(1920,1080)):
            for url, tag in ((NEW,"new"),(OLD,"old")):
                for mode, code in (("student",None),("teacher","rift2026"),("builder","runner-build")):
                    if tag == "old" and (mode != "student" or W != 1366): continue
                    page = await (await b.new_context(viewport={"width":W,"height":H})).new_page()
                    page.set_default_timeout(8000)
                    errs = []; page.on("pageerror", lambda e: errs.append(str(e)))
                    async def setup(pg):
                        if code:
                            await open_settings(pg); await enter_code(pg, code); await close_settings(pg)
                    await start(page, url, "Expert", None, setup)
                    await page.evaluate(ENGINE)
                    for state, js in (("build",None),
                        ("lastword","e=>{e.wordsUntilWave=1}"),
                        ("bonus_wait","e=>{e.bonusActive=true;e.bonusWave=1;e.wordsUntilWave=8;e.phase='between'}"),
                        ("bonus_wave","e=>{e.phase='wave';e.bonusWave=2}")):
                        if js:
                            await page.evaluate(f"()=>{{const e=window.__eng; ({js})(e); e.paused=true; e.emitSnapshot();}}")
                            await page.wait_for_timeout(350)
                        m = await page.evaluate(MEASURE)
                        bad = [i["name"]+(" COVERED" if i["covered"] else "")+(" CLIPPED" if i["clipped"] else "")+(f" SMALL {i['w']}x{i['h']}" if i["w"]<32 or i["h"]<32 else "")
                               for i in m["items"] if i["covered"] or i["clipped"] or i["w"]<32 or i["h"]<32]
                        print(f"{W}x{H} {tag} {mode:7} {state:10} map={m['area']} barH={m['barH']} overlaps={m['over']} problems={bad}")
                        if state in ("build","bonus_wait"):
                            await page.screenshot(path=f"{OUT}/s03_{tag}_{W}_{mode}_{state}.png")
                        if W==1366 and mode=="student" and state=="build":
                            print("   rects", [(i["name"],i["x"],i["y"],i["w"],i["h"]) for i in m["items"]])
                    if errs: print("ERR", errs[:3])
                    await page.context.close()
        await b.close()
asyncio.run(main())
