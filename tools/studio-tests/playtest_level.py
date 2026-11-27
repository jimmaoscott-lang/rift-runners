import asyncio, time, os, sys, random, json, re
from playwright.async_api import async_playwright

URL = "http://localhost:8765/rift-runners-studio/"
OUT = "/home/claude/tests/shots"
DIFF = sys.argv[1] if len(sys.argv) > 1 else "Normal"
ACC = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0   # chance a word is read right first try
TAG = sys.argv[3] if len(sys.argv) > 3 else "d"
MAXMIN = float(sys.argv[4]) if len(sys.argv) > 4 else 9

# find the 3 sound choices from React hook state
GET_CHOICES = r"""() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.offsetParent && b.innerText.trim() === '1');
  if (!btn) return null;
  const key = Object.keys(btn).find(k => k.startsWith('__reactFiber'));
  let f = btn[key];
  while (f) {
    let h = f.memoizedState, n = 0;
    while (h && n < 200) {
      const v = h.memoizedState;
      if (Array.isArray(v) && v.length >= 2 && v.length <= 4 && v.every(x => typeof x === 'string')) return v;
      h = h.next; n++;
    }
    f = f.return;
  }
  return null;
}"""

WORD_OLD = r"""() => { const els=[...document.querySelectorAll('div,span,p,h1,h2,h3')].filter(e=>e.offsetParent && /^[a-z]{2,8}$/.test((e.innerText||'').trim()) && parseFloat(getComputedStyle(e).fontSize)>=30); return els.length?els[0].innerText.trim():null; }"""
WORD = r"""() => {
  const btn = [...document.querySelectorAll('button')].find(b => b.offsetParent && (b.getAttribute('aria-label')||'') === 'Sound 1');
  if (!btn) return null;
  const key = Object.keys(btn).find(k => k.startsWith('__reactFiber'));
  let f = btn[key];
  while (f) {
    let h = f.memoizedState, n = 0;
    while (h && n < 200) {
      const v = h.memoizedState;
      const cands = [v, Array.isArray(v) ? v[0] : null];
      for (const c of cands) if (c && typeof c === 'object' && !Array.isArray(c) && typeof c.w === 'string' && (c.kind === 'real' || c.kind === 'rune') && Array.isArray(c.options)) return c.w;
      h = h.next; n++;
    }
    const pr = f.memoizedProps || {};
    for (const k in pr) { const c = pr[k]; if (c && typeof c === 'object' && typeof c.w === 'string' && (c.kind === 'real' || c.kind === 'rune') && Array.isArray(c.options)) return c.w; }
    f = f.return;
  }
  return null;
}"""
CRYS = r"""() => { const t=document.body.innerText.trim().split('\n')[0]; return parseInt(t)||0; }"""

SPOTS=[(420,300),(330,420),(560,250),(470,430),(600,400),(300,330),(520,160),(250,480),(380,250),(640,330),(420,500),(330,200),(700,200),(160,460)]

async def vis_buttons(page):
    return await page.eval_on_selector_all("button", "els=>els.filter(e=>e.offsetParent && !e.disabled).map(e=>e.innerText.trim().replace(/\\s+/g,' ')).filter(Boolean)")

async def click_btn(page, text, exact=True):
    loc = page.get_by_role("button", name=text, exact=exact)
    if await loc.count():
        try:
            await loc.first.click(timeout=1500); return True
        except Exception:
            return False
    return False

async def try_place(page, name, cost):
    c = await page.evaluate(CRYS)
    if c < cost: return False
    if not await click_btn(page, name, exact=False): return False
    await page.wait_for_timeout(200)
    spots = SPOTS[:] ; random.shuffle(spots)
    for (x0, y0) in spots * 2:
        x, y = x0 + random.randint(-25, 25), y0 + random.randint(-25, 25)
        await page.mouse.move(x, y); await page.wait_for_timeout(40)
        await page.mouse.click(x, y); await page.wait_for_timeout(120)
        if await page.evaluate(CRYS) < c:
            return True
    await page.mouse.click(500, 400, button="right")
    return False

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome",
                                    args=["--autoplay-policy=no-user-gesture-required"])
        ctx = await b.new_context(viewport={"width": 1366, "height": 768})
        page = await ctx.new_page()
        logs = []
        page.on("console", lambda m: logs.append(f"[{m.type}] {m.text}") if m.type in ("error",) else None)
        page.on("pageerror", lambda e: logs.append(f"[PAGEERROR] {e}"))
        await page.goto(URL, wait_until="networkidle")
        await click_btn(page, DIFF)
        await click_btn(page, "Jump Straight to Battle")
        await page.wait_for_timeout(1500)
        await click_btn(page, "Skip")
        await page.wait_for_timeout(500)
        await click_btn(page, "1x")  # -> 2x
        t0 = time.time(); words = 0; misses = 0; shots = 0; placed = []
        order = [("Archer Tower", 60), ("Spike Pit", 40), ("Archer Tower", 60), ("Frost Totem", 80), ("Stone Golem", 100), ("Archer Tower", 60)]
        oi = 0
        while time.time() - t0 < MAXMIN * 60:
            body = await page.inner_text("body")
            if any(k in body for k in ("Rift Sealed", "Victory", "VICTORY", "Anchor Fell", "Defeat", "DEFEAT", "Rift Breached")) and "Forge" not in body[-400:]:
                break
            # handle modals: sound rule cards etc.
            for t in ("Got it", "Continue", "Close", "OK", "Keep going", "Back to battle", "Resume"):
                if await click_btn(page, t): await page.wait_for_timeout(300)
            choices = await page.evaluate(GET_CHOICES)
            word = await page.evaluate(WORD)
            if choices and word and word in choices:
                right = random.random() < ACC
                idx = choices.index(word) if right else (choices.index(word) + 1) % len(choices)
                await click_btn(page, f"Sound {idx + 1}")
                await page.wait_for_timeout(1700)
                fb = page.locator("button").filter(has_text=re.compile(r"^\s*Forge"))
                if await fb.count() and not await fb.first.is_disabled():
                    await fb.first.click()
                    words += 1
                    if not right: misses += 1
                await page.wait_for_timeout(900)
            else:
                await page.wait_for_timeout(500)
            for hp in ("Rally", "Meteor", "Freeze"):
                l = page.locator("button").filter(has_text=re.compile(hp + r"\s*GO"))
                if await l.count():
                    try:
                        await l.first.click(timeout=800); await page.wait_for_timeout(150)
                        if hp == "Meteor": await page.mouse.click(380, 330)
                    except Exception: pass
            if oi < len(order):
                n, cst = order[oi]
                if await try_place(page, n, cst):
                    placed.append(n); oi += 1
            elif await page.evaluate(CRYS) > 150:
                order.append(random.choice([("Archer Tower", 60), ("Frost Totem", 80), ("Stone Golem", 100)]))
            if time.time() - t0 > shots * 60:
                await page.screenshot(path=f"{OUT}/{TAG}_t{shots}.png"); shots += 1
                print("min", shots-1, "crys", await page.evaluate(CRYS), "words", words, "placed", len(placed), (await page.inner_text("body"))[:200].replace("\n"," "), flush=True)
        await page.wait_for_timeout(1500)
        await page.screenshot(path=f"{OUT}/{TAG}_end.png")
        body = await page.inner_text("body")
        print(f"diff={DIFF} acc={ACC} words={words} misses={misses} mins={(time.time()-t0)/60:.1f} placed={placed}")
        print("END TEXT:", body[:1800].replace("\n", " | "))
        print("ERRORS:", "\n".join([l for l in logs if "speech" not in l and "googleapis" not in l][-15:]))
        await b.close()

asyncio.run(main())
