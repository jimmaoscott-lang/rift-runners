"""S-02 check: Builder Mode and difficulty dials. Serve the new build on 8765.
Optionally serve the build from before S-02 on 8766 to compare default creatures."""
import asyncio, re, json, sys
from playwright.async_api import async_playwright

NEW = "http://localhost:8765/rift-runners-studio/"
OLD = "http://localhost:8766/rift-runners-studio/"
OUT = "/home/claude/tests/shots"
DIFFS = ["Easy", "Normal", "Hard", "Expert"]

# find the battle engine through React refs
ENGINE = r"""() => {
  const root = document.getElementById('root');
  const k = Object.keys(root).find(k => k.startsWith('__reactContainer'));
  const stack = [root[k].stateNode.current];
  while (stack.length) {
    const f = stack.pop(); if (!f) continue;
    let h = f.memoizedState, n = 0;
    while (h && typeof h === 'object' && n < 200) {
      const v = h.memoizedState;
      if (v && v.current && v.current.spawnQueue) { window.__eng = v.current; return true; }
      h = h.next; n++;
    }
    stack.push(f.child, f.sibling);
  }
  return false;
}"""

async def click(page, name, exact=True):
    await page.get_by_role("button", name=name, exact=exact).first.click(timeout=4000)
    await page.wait_for_timeout(350)

async def open_settings(page):
    loc = page.locator('button[aria-label="Open Settings"]')
    if await loc.count(): await loc.first.click()
    else: await page.locator("button", has_text=re.compile(r"^\s*Settings\s*$")).first.click()
    await page.wait_for_timeout(500)

async def enter_code(page, code):
    await click(page, re.compile("Teacher Tools"))
    inp = page.locator("input[type=password], input[type=text]").last
    await inp.fill(code); await inp.press("Enter"); await page.wait_for_timeout(500)

async def close_settings(page):
    for name in (re.compile(r"^(Done|Close|Save.*|Back.*)$"), re.compile("Close")):
        l = page.get_by_role("button", name=name)
        if await l.count():
            await l.last.click(); await page.wait_for_timeout(500); return

async def dial_inputs(page):
    return await page.locator('input[aria-label$="%"], input[aria-label$="between waves"]').count()

async def set_dial(page, diff, field, value):
    # type key by key, the way a person does
    loc = page.get_by_label(f"{diff} {field}", exact=True)
    await loc.click(); await loc.press("Control+a"); await loc.press("Backspace")
    await loc.press_sequentially(str(value), delay=60)
    await loc.press("Tab"); await page.wait_for_timeout(200)
    return await loc.input_value()

async def hud(page):
    body = await page.inner_text("body")
    m = re.search(r"(W\d+|Final Wave) · (\d+)w", body)
    return int(m.group(2)) if m else None

async def wave_one(page):
    assert await page.evaluate(ENGINE), "engine not found"
    before = await hud(page)
    # read the queue in the same tick that wave 1 starts
    data = await page.evaluate("""() => { const e=window.__eng; e.startNextWave();
      const c={}; e.spawnQueue.forEach(q=>c[q.type]=(c[q.type]||0)+1);
      const n=e.creatures.length; const types=Object.keys(c); const stats={};
      types.forEach(t=>{ e.spawnCreature(t, e.spawnQueue.find(q=>q.type===t).hpMult);
        const x=e.creatures[e.creatures.length-1]; stats[t]=[x.maxHp, +x.speed.toFixed(2)]; });
      e.creatures.length=n; return {level:e.level.id, counts:c, stats}; }""")
    data["words"] = before
    return data

async def start(page, url, diff, level_world=None, setup=None):
    await page.goto(url, wait_until="networkidle")
    if setup: await setup(page)
    if level_world:
        await click(page, re.compile(level_world))
    await click(page, diff)
    await click(page, "Jump Straight to Battle")
    await page.wait_for_timeout(1500)
    skip = page.get_by_role("button", name="Skip", exact=True)
    if await skip.count(): await skip.first.click(); await page.wait_for_timeout(300)

async def unlock(page):
    await open_settings(page); await enter_code(page, "rift2026")
    await click(page, re.compile("Unlock All Levels"))
    await close_settings(page)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        async def fresh(w=1366, h=768):
            ctx = await b.new_context(viewport={"width": w, "height": h},
                                      permissions=["clipboard-read", "clipboard-write"])
            page = await ctx.new_page(); page.set_default_timeout(8000)
            page.on("pageerror", lambda e: print("PAGEERROR", e))
            return page

        # 1. student view and teacher mode show no dials
        pg = await fresh(); await pg.goto(NEW, wait_until="networkidle"); await open_settings(pg)
        t = await pg.inner_text("body")
        print("student: dial inputs", await dial_inputs(pg), "| dials text", "difficulty dials" in t.lower(), "| builder text", "builder" in t.lower())
        await enter_code(pg, "rift2026"); t = await pg.inner_text("body")
        print("teacher: badge", "Teacher Mode on" in t, "| dial inputs", await dial_inputs(pg), "| builder text", "builder" in t.lower() or "runner-build" in t)
        pg = await fresh(); await pg.goto(NEW, wait_until="networkidle"); await open_settings(pg)
        await enter_code(pg, "runner-build"); t = await pg.inner_text("body")
        print("builder: badge", "Builder Mode on" in t, "| dial inputs", await dial_inputs(pg))
        await pg.screenshot(path=f"{OUT}/s02_builder.png")

        # 2. default creatures, new build vs the build before S-02
        for world in (None, "World 2"):
            for d in DIFFS:
                res = []
                for url in (NEW, OLD):
                    pg = await fresh()
                    try:
                        await start(pg, url, d, world, unlock if world else None)
                        res.append(await wave_one(pg))
                    except Exception as e:
                        res.append({"error": str(e)[:200]})
                print(("SAME" if res[0] == res[1] else "DIFF"), d, json.dumps(res[0]))
                if res[0] != res[1]: print("      old:", json.dumps(res[1]))

        # 3. one dial at a time: affects only its own difficulty
        for field, val in (("Number of creatures %", 50), ("Extra words between waves", 2),
                           ("Extra words between waves", -3), ("Creature health %", 200),
                           ("Creature speed %", 150)):
            for d in DIFFS:
                async def setup(page, field=field, val=val):
                    await open_settings(page); await enter_code(page, "runner-build")
                    shown = await set_dial(page, "Normal", field, val)
                    if shown != str(val): print("   typed", val, "box shows", shown)
                    await close_settings(page)
                pg = await fresh(); await start(pg, NEW, d, None, setup)
                print(f"Normal {field}={val} -> {d}:", json.dumps(await wave_one(pg)))

        # 4. limits, copy, reset, storage, reload
        pg = await fresh(); await pg.goto(NEW, wait_until="networkidle")
        keys0 = await pg.evaluate("Object.keys(localStorage).sort()")
        await open_settings(pg); await enter_code(pg, "runner-build")
        for field, vals in (("Creature health %", (999, 1)), ("Creature speed %", (999, 1)),
                            ("Number of creatures %", (999, 1)), ("Extra words between waves", (99, -99))):
            for v in vals:
                print("limit", field, v, "->", await set_dial(pg, "Easy", field, v))
        await set_dial(pg, "Hard", "Creature health %", 150)
        await click(pg, "Copy dial values")
        print("clipboard:\n" + await pg.evaluate("navigator.clipboard.readText()"))
        await click(pg, "Reset to default")
        vals = await pg.eval_on_selector_all('input[aria-label$="%"], input[aria-label$="between waves"]', "e=>e.map(i=>i.value)")
        print("after reset", vals)
        await set_dial(pg, "Hard", "Creature health %", 150)
        stored = await pg.evaluate("JSON.stringify(localStorage)")
        print("keys before", keys0, "\nkeys after", await pg.evaluate("Object.keys(localStorage).sort()"))
        print("storage mentions dials/builder:", bool(re.search("dial|healthPct|builder|runner-build", stored, re.I)))
        await pg.reload(wait_until="networkidle"); await open_settings(pg); t = await pg.inner_text("body")
        print("after reload: builder", "Builder Mode on" in t, "| inputs", await dial_inputs(pg))
        await enter_code(pg, "runner-build")
        print("after reload Hard health:", await pg.get_by_label("Hard Creature health %", exact=True).input_value())

        # 5. changing a dial in the middle of a battle; walking back to the title
        pg = await fresh(); await start(pg, NEW, "Normal")
        w0 = await hud(pg)
        await open_settings(pg); await enter_code(pg, "runner-build")
        await set_dial(pg, "Normal", "Extra words between waves", 2); await close_settings(pg)
        print("mid-battle extra +2: counter", w0, "->", await hud(pg))
        await pg.screenshot(path=f"{OUT}/s02_battle_builder.png")
        await b.close()

if __name__ == "__main__":
    asyncio.run(main())
