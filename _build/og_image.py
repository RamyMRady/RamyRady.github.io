"""Render assets/og-image.png (1200x630 link-preview card). Needs: pip install playwright.

    python3 _build/og_image.py
"""
import base64
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

import figures

ROOT = Path(__file__).resolve().parent.parent
photo = base64.b64encode((ROOT / "assets/profile-photo.jpg").read_bytes()).decode()

HTML = f"""<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&family=IBM+Plex+Sans:wght@400;500&family=Source+Serif+4:opsz,wght@8..60,600&display=swap">
<link rel="stylesheet" href="{(ROOT / 'styles.css').as_uri()}">
<style>
html, body {{ margin: 0; width: 1200px; height: 630px; overflow: hidden; }}
body {{ background: #fbfcfd; display: grid; grid-template-columns: 1fr 340px; gap: 56px;
       padding: 0 80px; box-sizing: border-box; align-items: center; }}
.t {{ display: grid; gap: 14px; }}
h1 {{ font: 600 64px/1.05 'Source Serif 4', serif; color: #0f172a; margin: 0; }}
.r {{ font: 500 25px/1.35 'IBM Plex Sans', sans-serif; color: #334155; }}
.u {{ font: 500 20px 'IBM Plex Mono', monospace; color: #0b6e99; }}
.fig {{ background: #f2f5f9; border-radius: 12px; padding: 4px; width: 500px; }}
img {{ width: 340px; height: 340px; border-radius: 20px; object-fit: cover; box-shadow: 0 20px 50px rgba(15,23,42,.18); }}
</style></head><body>
<div class="t">
  <h1>Ramy Rady, Ph.D.</h1>
  <p class="r">SerDes analog/mixed-signal design · Apple<br>RF &amp; microwave silicon photonics</p>
  {figures.RECEIVER}
  <p class="u">ramyrady.com</p>
</div>
<img src="data:image/jpeg;base64,{photo}" alt="">
</body></html>"""

with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
    f.write(HTML)
with sync_playwright() as p:
    try:
        browser = p.chromium.launch(channel="chrome")  # use installed Chrome if present
    except Exception:
        browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    page.goto(Path(f.name).as_uri())
    page.wait_for_timeout(1500)
    page.screenshot(path=str(ROOT / "assets/og-image.png"))
    browser.close()
print("Wrote assets/og-image.png")
