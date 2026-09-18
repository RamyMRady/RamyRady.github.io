"""Generate the site's HTML pages from data.py.

    python3 _build/build.py

Writes index.html, research.html, publications.html, resume.html,
redirect pages for retired URLs, and sitemap.xml into the repo root.
"""
import html
import json
from datetime import date
import re
from pathlib import Path

import data as D
import figures

ROOT = Path(__file__).resolve().parent.parent
ASSET_V = "5"  # bump to bust browser caches for styles.css / script.js

NAV = [
    ("index.html", "About"),
    ("research.html", "Research"),
    ("publications.html", "Publications"),
    ("resume.html", "CV"),
]

ICONS = {
    "mail": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm1 2.4V17h16V7.4l-8 5.3-8-5.3ZM5.2 7 12 11.5 18.8 7H5.2Z"/></svg>',
    "scholar": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/></svg>',
    "linkedin": '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>',
    "rg": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3h18v18H3V3Zm2 2v14h14V5H5Zm2.2 11.5V7.6h2.9c1.9 0 2.9.9 2.9 2.4 0 1.1-.6 1.9-1.6 2.2l2 4.3h-1.9l-1.8-4H8.9v4H7.2Zm1.7-5.4h1.1c.9 0 1.4-.4 1.4-1.1 0-.7-.5-1.1-1.4-1.1H8.9v2.2Zm8.6 5.5c-1.3 0-2-.8-2-2.2v-1.1c0-1.4.8-2.2 2.1-2.2 1 0 1.7.5 1.9 1.4l-1.2.3c-.1-.4-.3-.6-.7-.6-.5 0-.7.3-.7 1v1.3c0 .7.3 1 .8 1s.8-.3.8-.9v-.2h-.8v-1h2.1v1.2c0 1.3-.8 2-2.3 2Z"/></svg>',
    "cv": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h8l6 6v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Zm7 1.5V9h5.5L13 3.5ZM8 13v1.6h8V13H8Zm0 3.4V18h8v-1.6H8Z"/></svg>',
    "sun": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0-5 1 3h-2l1-3Zm0 20-1-3h2l-1 3ZM2 12l3-1v2l-3-1Zm20 0-3 1v-2l3 1ZM4.9 4.9l2.8 1.4-1.4 1.4-1.4-2.8Zm14.2 14.2-2.8-1.4 1.4-1.4 1.4 2.8Zm0-14.2-1.4 2.8-1.4-1.4 2.8-1.4ZM4.9 19.1l1.4-2.8 1.4 1.4-2.8 1.4Z"/></svg>',
    "moon": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 14.7A8.5 8.5 0 0 1 9.3 3.3 8.5 8.5 0 1 0 20.7 14.7Z"/></svg>',
}

LINKS = [
    ("mailto:" + D.PERSON["email"], "mail", "Email"),
    ("assets/Ramy_Rady_CV.pdf", "cv", "CV (PDF)"),
    (D.PERSON["scholar"], "scholar", "Google Scholar"),
    (D.PERSON["linkedin"], "linkedin", "LinkedIn"),
    (D.PERSON["researchgate"], "rg", "ResearchGate"),
]


def ext(url):
    return ' target="_blank" rel="noopener"' if url.startswith("http") else ""


def head(path, title, desc, jsonld=None):
    url = D.SITE_URL + ("/" if path == "index.html" else "/" + path)
    ld = f'\n    <script type="application/ld+json">\n{json.dumps(jsonld, indent=2, ensure_ascii=False)}\n    </script>' if jsonld else ""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <meta name="author" content="Ramy Rady">
    <link rel="canonical" href="{url}">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16x16.png">
    <meta property="og:type" content="{'profile' if path == 'index.html' else 'website'}">
    <meta property="og:site_name" content="Ramy Rady">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:url" content="{url}">
    <meta property="og:image" content="{D.SITE_URL}/assets/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="{desc}">
    <meta name="twitter:image" content="{D.SITE_URL}/assets/og-image.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600&display=swap">
    <link rel="stylesheet" href="styles.css?v={ASSET_V}">
    <script>try{{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;}}catch(e){{}}</script>{ld}
</head>
<body>
    <a class="skip-link" href="#main">Skip to content</a>
"""


def header(path):
    items = "\n".join(
        f'                <li><a href="{href}"{" aria-current=\"page\"" if href == path else ""}>{label}</a></li>'
        for href, label in NAV
    )
    return f"""    <header class="site-header">
        <div class="wrap header-inner">
            <a class="brand" href="index.html">Ramy Rady</a>
            <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
                <span class="sr-only">Menu</span><span class="bar"></span><span class="bar"></span>
            </button>
            <nav id="site-nav" class="site-nav" aria-label="Main">
                <ul>
{items}
                </ul>
                <button class="theme-toggle" type="button" aria-label="Toggle dark mode">
                    <span class="icon-sun">{ICONS['sun']}</span><span class="icon-moon">{ICONS['moon']}</span>
                </button>
            </nav>
        </div>
    </header>
"""


def footer():
    links = " · ".join(
        f'<a href="{u}"{ext(u)}>{label}</a>' for u, _, label in LINKS if not u.startswith("assets")
    )
    built = date.today().strftime("%d %B %Y")
    return f"""    <footer class="site-footer">
        <div class="wrap footer-inner">
            <p>© 2026 Ramy Rady</p>
            <p>{links}</p>
        </div>
        <div class="wrap site-status">
            <p class="status-live"><span class="live-dot" aria-hidden="true"></span> Site live · updated {built}</p>
            <p class="status-count" hidden><span class="count-value"></span> <span class="count-label">visits</span></p>
        </div>
    </footer>
    <script src="script.js?v={ASSET_V}"></script>
</body>
</html>
"""


def page(path, title, desc, body, jsonld=None):
    out = head(path, title, desc, jsonld) + header(path) + f'    <main id="main">\n{body}\n    </main>\n' + footer()
    (ROOT / path).write_text(out)


# ---------- publications ----------

def fmt_authors(authors):
    return ", ".join(f'<span class="me">{a}</span>' if a == "R. Rady" else a for a in authors)


def venue_line(p):
    bits = [f"<em>{p['venue']}</em>"]
    if p.get("volume"):
        bits.append(f"vol. {p['volume']}" + (f", no. {p['number']}" if p.get("number") else ""))
    if p.get("pages"):
        bits.append(("pp. " if "–" in p["pages"] else "") + p["pages"])
    bits.append((p["month"] + " " if p.get("month") else "") + str(p["year"]))
    return ", ".join(bits)


def plain(s):
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s)


def bib_escape(s):
    s = plain(s)
    return (s.replace("&", r"\&").replace("–", "--").replace("−", "$-$")
             .replace(">", r"$>$").replace("<", r"$<$").replace("Ş", r"\c{S}"))


def bibtex(p):
    kind = {"journal": "article", "conference": "inproceedings", "preprint": "misc", "thesis": "phdthesis"}[p["kind"]]
    fields = [("title", "{" + bib_escape(p["title"]) + "}")]
    fields.append(("author", " and ".join(bib_escape(a) for a in p["authors"])))
    if p["kind"] == "journal":
        fields.append(("journal", bib_escape(p["venue"])))
    elif p["kind"] == "conference":
        fields.append(("booktitle", bib_escape(p["venue"])))
    elif p["kind"] == "thesis":
        fields.append(("school", bib_escape(p["school"])))
    else:
        fields += [("eprint", p["eprint"]), ("archivePrefix", "arXiv")]
    for k in ("volume", "number", "pages"):
        if p.get(k):
            fields.append((k, bib_escape(p[k])))
    if p.get("month"):
        fields.append(("month", p["month"].lower()))
    fields.append(("year", str(p["year"])))
    if p.get("doi"):
        fields.append(("doi", p["doi"]))
    body = ",\n".join(f"  {k:<9} = {{{v}}}" for k, v in fields)
    return f"@{kind}{{{p['key']},\n{body}\n}}"


def pub_item(p, show_cite=True):
    btns = []
    if p.get("doi"):
        btns.append(f'<a class="chip-btn" href="https://doi.org/{p["doi"]}" target="_blank" rel="noopener">DOI</a>')
    if p.get("url"):
        btns.append(f'<a class="chip-btn" href="{p["url"]}" target="_blank" rel="noopener">arXiv</a>')
    if p.get("open_access"):
        btns.append('<span class="chip-note">Open access</span>')
    cite = ""
    if show_cite:
        btns.append(f'<button class="chip-btn" type="button" data-cite="bib-{p["key"]}" aria-expanded="false">Cite</button>')
        cite = (f'\n                    <div class="bib" id="bib-{p["key"]}" hidden><pre>{html.escape(bibtex(p))}</pre>'
                f'<button class="chip-btn copy-bib" type="button">Copy BibTeX</button></div>')
    first = p["authors"][0] == "R. Rady"
    return f"""                <li class="pub" id="{p['key']}" data-kind="{p['kind']}" data-first="{str(first).lower()}">
                    <span class="badge badge-{p['kind']}">{p['badge']}</span>
                    <div class="pub-body">
                        <p class="pub-title">{p['title']}</p>
                        <p class="pub-authors">{fmt_authors(p['authors'])}</p>
                        <p class="pub-venue">{venue_line(p)}</p>
                        <p class="pub-links">{' '.join(btns)}</p>{cite}
                    </div>
                </li>"""


# ---------- pages ----------

def person_jsonld():
    return {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": "Ramy Rady",
        "honorificSuffix": "Ph.D.",
        "jobTitle": D.PERSON["role"],
        "worksFor": {"@type": "Organization", "name": "Apple"},
        "url": D.SITE_URL + "/",
        "image": D.SITE_URL + "/" + D.PERSON["photo"],
        "email": "mailto:" + D.PERSON["email"],
        "sameAs": [D.PERSON["scholar"], D.PERSON["linkedin"], D.PERSON["researchgate"]],
        "alumniOf": [
            {"@type": "CollegeOrUniversity", "name": "Texas A&M University"},
            {"@type": "CollegeOrUniversity", "name": "Istanbul Şehir University"},
            {"@type": "CollegeOrUniversity", "name": "Ain Shams University"},
        ],
        "knowsAbout": [plain(i) for i in D.INTERESTS] + ["SerDes", "Analog/mixed-signal IC design", "Microwave photonics"],
    }


def build_index():
    links = "\n".join(
        f'                        <li><a href="{u}"{ext(u)}{" download" if u.endswith(".pdf") else ""}>{ICONS[i]}<span>{label}</span></a></li>'
        for u, i, label in LINKS
    )
    interests = "\n".join(f"                        <li>{html.escape(i)}</li>" for i in D.INTERESTS)
    bio = "\n".join(f"                    <p>{p}</p>" for p in D.BIO)
    news = "\n".join(
        f'                <li><time>{d}</time><p>{t}</p></li>' for d, _, t in sorted(D.NEWS, key=lambda n: n[1], reverse=True)
    )
    selected = "\n".join(pub_item(p, show_cite=False) for p in D.PUBS if p.get("selected"))
    themes = "\n".join(
        f"""                <a class="theme-card" href="research.html#{t['id']}">
                    <div class="theme-fig">{figures.FIGS[t['figure']]}</div>
                    <h3>{t['title']}</h3>
                </a>""" for t in D.THEMES
    )
    term_lines = "\n".join(
        f'                        <p class="term-cmd"><span class="term-prompt">$</span> <span class="term-typed">{cmd}</span></p>\n'
        f'                        <p class="term-out">{out}</p>'
        for cmd, out in D.TERMINAL
    )
    chip = figures.CHIP_BG
    s = D.SCHOLAR_STATS
    body = f"""        <section class="wrap intro" id="about" aria-labelledby="name">
            <div class="intro-text">
                <h1 id="name">Ramy Rady<span class="suffix">, Ph.D.</span></h1>
                <p class="role">{D.PERSON['role']} · <strong>{D.PERSON['org']}</strong>, {D.PERSON['group']}</p>
{bio}
                <div class="interests">
                    <h2 class="label">Interests</h2>
                    <ul>
{interests}
                    </ul>
                </div>
            </div>
            <aside class="intro-card">
                <img src="{D.PERSON['photo']}" alt="Ramy Rady" width="720" height="720">
                <div class="intro-card-body">
                    <p class="where">{D.PERSON['location']}</p>
                    <ul class="link-list">
{links}
                    </ul>
                </div>
            </aside>
        </section>

        <section class="terminal-band" aria-label="Summary in a terminal">
            <div class="chip-bg">{chip}</div>
            <div class="wrap">
                <div class="term">
                    <div class="term-bar">
                        <span class="term-dots"><i></i><i></i><i></i></span>
                        <span class="term-title">ramyrady@portfolio:~$</span>
                    </div>
                    <div class="term-body">
{term_lines}
                    </div>
                </div>
            </div>
        </section>

        <section class="wrap block" aria-labelledby="news-h">
            <h2 id="news-h">News</h2>
            <ul class="news">
{news}
            </ul>
        </section>

        <section class="wrap block" aria-labelledby="research-h">
            <div class="block-head">
                <h2 id="research-h">Research</h2>
                <a class="more" href="research.html">All research →</a>
            </div>
            <div class="theme-grid">
{themes}
            </div>
        </section>

        <section class="wrap block" aria-labelledby="pubs-h">
            <div class="block-head">
                <h2 id="pubs-h">Selected publications</h2>
                <a class="more" href="publications.html">All {len(D.PUBS)} publications →</a>
            </div>
            <p class="stats"><span><b>{s['citations']}</b> citations</span><span><b>h-index {s['h']}</b></span><span class="muted">Google Scholar, {s['as_of']}</span></p>
            <ol class="pub-list">
{selected}
            </ol>
        </section>

        <section class="wrap block" aria-labelledby="honors-h">
            <h2 id="honors-h">Honors</h2>
            <ul class="dated">
{chr(10).join(f'                <li><time>{y}</time><p>{h}</p></li>' for y, h in D.HONORS)}
            </ul>
        </section>

        <section class="wrap block contact" id="contact" aria-labelledby="contact-h">
            <h2 id="contact-h">Contact</h2>
            <div class="contact-grid">
                <div>
                    <p>The fastest way to reach me is email: <a href="mailto:{D.PERSON['email']}">{D.PERSON['email']}</a>. I'm happy to talk about SerDes and analog front-ends, RF/microwave photonics, and mm-wave silicon photonic systems.</p>
                </div>
                <form class="contact-form" novalidate>
                    <div class="field">
                        <label for="cf-name">Name</label>
                        <input id="cf-name" name="name" autocomplete="name" required>
                    </div>
                    <div class="field">
                        <label for="cf-email">Your email</label>
                        <input id="cf-email" name="email" type="email" autocomplete="email" required>
                    </div>
                    <div class="field">
                        <label for="cf-message">Message</label>
                        <textarea id="cf-message" name="message" rows="4" required></textarea>
                    </div>
                    <button class="button" type="submit">Continue</button>
                    <p class="form-note">Next you'll pick how to send: Gmail, Outlook, or your mail app.</p>
                    <div class="send-options" hidden>
                        <p class="send-head">Send your message with</p>
                        <div class="send-buttons">
                            <a class="button send-gmail" href="#" target="_blank" rel="noopener">Gmail</a>
                            <a class="button send-outlook" href="#" target="_blank" rel="noopener">Outlook</a>
                            <a class="button send-mailto" href="#">Mail app</a>
                        </div>
                        <button class="chip-btn copy-message" type="button">Copy message</button>
                        <p class="form-note">Or write to <a href="mailto:engramyrady@gmail.com">engramyrady@gmail.com</a> directly.</p>
                    </div>
                    <p class="form-status" role="status" aria-live="polite" hidden></p>
                </form>
            </div>
        </section>"""
    page("index.html", "Ramy Rady, Ph.D. · SerDes & RF Silicon Photonics",
         "Ramy Rady is a SerDes analog/mixed-signal design engineer at Apple. His Ph.D. research at Texas A&M built wideband mm-wave receivers from CMOS and silicon photonics.",
         body, person_jsonld())


def build_research():
    by_theme = {}
    for p in D.PUBS:
        if p.get("theme"):
            by_theme.setdefault(p["theme"], []).append(p)
    sections = []
    for t in D.THEMES:
        results = "\n".join(f"                        <li>{r}</li>" for r in t["results"])
        papers = "\n".join(
            f'                        <li><a href="publications.html#{p["key"]}">{p["title"]}</a> <span class="muted">{p["badge"]} {p["year"]}</span></li>'
            for p in by_theme.get(t["id"], [])
        )
        sections.append(f"""        <section class="wrap theme" id="{t['id']}" aria-labelledby="{t['id']}-h">
            <div class="theme-text">
                <h2 id="{t['id']}-h">{t['title']}</h2>
                <p>{t['summary']}</p>
                <h3 class="label">Key results</h3>
                <ul class="results">
{results}
                </ul>
                <details>
                    <summary>Papers ({len(by_theme.get(t['id'], []))})</summary>
                    <ul class="paper-links">
{papers}
                    </ul>
                </details>
            </div>
            <figure class="theme-figure">
                {figures.FIGS[t['figure']]}
                <figcaption>{figures.CAPTIONS[t['figure']]}</figcaption>
            </figure>
        </section>""")
    industry = "\n".join(
        f"""                <li><time>{e['when']}</time><div><p><b>{e['org']}</b> · {e['role']}</p><p class="muted">{e['points'][0]}</p></div></li>"""
        for e in D.EXPERIENCE if "Texas" not in e["org"]
    )
    body = f"""        <section class="wrap page-head">
            <h1>Research</h1>
            <p class="lede">My Ph.D. work at Texas A&amp;M combined CMOS circuits and silicon photonics to build wideband, reconfigurable mm-wave radios. The sections below cover each thread, its published results, and the papers behind them.</p>
            <nav class="toc" aria-label="Research themes">
                {' '.join(f'<a href="#{t["id"]}">{t["title"]}</a>' for t in D.THEMES)}
            </nav>
        </section>
{chr(10).join(sections)}
        <section class="wrap block" aria-labelledby="industry-h">
            <h2 id="industry-h">Industry work</h2>
            <p class="muted">Industry projects are proprietary, so only a summary appears here. See the <a href="resume.html#experience">CV</a> for more.</p>
            <ul class="dated dated-wide">
{industry}
            </ul>
        </section>"""
    page("research.html", "Research · Ramy Rady",
         "Research by Ramy Rady on wideband mm-wave CMOS/silicon photonic receivers, automatic tuning of photonic filters, radio-over-fiber links, and low-power CMOS transceivers.",
         body)


def build_publications():
    years = sorted({p["year"] for p in D.PUBS}, reverse=True)
    groups = []
    for y in years:
        items = "\n".join(pub_item(p) for p in D.PUBS if p["year"] == y)
        groups.append(f"""            <section class="year-group" aria-labelledby="y{y}">
                <h2 id="y{y}" class="year">{y}</h2>
                <ol class="pub-list">
{items}
                </ol>
            </section>""")
    counts = {k: sum(p["kind"] == k for p in D.PUBS) for k in ("journal", "conference")}
    first = sum(p["authors"][0] == "R. Rady" for p in D.PUBS)
    s = D.SCHOLAR_STATS
    body = f"""        <section class="wrap page-head">
            <h1>Publications</h1>
            <p class="lede">{counts['journal']} journal papers, {counts['conference']} conference papers, a preprint, and a dissertation. {first} are first-author. Citation counts are on <a href="{D.PERSON['scholar']}" target="_blank" rel="noopener">Google Scholar</a> ({s['citations']} citations, h-index {s['h']}, {s['as_of']}).</p>
            <div class="filters" role="group" aria-label="Filter publications">
                <button type="button" class="filter" data-filter="all" aria-pressed="true">All</button>
                <button type="button" class="filter" data-filter="journal" aria-pressed="false">Journals</button>
                <button type="button" class="filter" data-filter="conference" aria-pressed="false">Conferences</button>
                <button type="button" class="filter" data-filter="first" aria-pressed="false">First author</button>
            </div>
        </section>
        <div class="wrap pubs-page">
{chr(10).join(groups)}
        </div>"""
    page("publications.html", "Publications · Ramy Rady",
         "Journal and conference publications by Ramy Rady on mm-wave silicon photonics, RF photonic receivers, radio-over-fiber, and CMOS circuits, with DOI links and BibTeX.",
         body)


def build_resume():
    exp = "\n".join(
        f"""                <li class="cv-item">
                    <time>{e['when']}</time>
                    <div>
                        <h3>{e['role']}</h3>
                        <p class="cv-org"><b>{e['org']}</b> · {e['unit']}</p>
                        <ul>
{chr(10).join(f'                            <li>{pt}</li>' for pt in e['points'])}
                        </ul>
                    </div>
                </li>""" for e in D.EXPERIENCE
    )
    edu = "\n".join(
        f"""                <li class="cv-item">
                    <time>{w}</time>
                    <div>
                        <h3>{deg}</h3>
                        <p class="cv-org"><b>{school}</b></p>
                        <p>{note}</p>
                    </div>
                </li>""" for w, deg, school, note in D.EDUCATION
    )
    honors = "\n".join(f"                <li><time>{y}</time><p>{h}</p></li>" for y, h in D.HONORS)
    media = "\n".join(
        f'                <li><time>{d}</time><p><a href="{u}" target="_blank" rel="noopener">{t}</a> <span class="muted">{src}</span></p></li>'
        for d, src, t, u in D.MEDIA
    )
    skills = "\n".join(f"                <div><dt>{k}</dt><dd>{v}</dd></div>" for k, v in D.SKILLS)
    selected = "\n".join(pub_item(p, show_cite=False) for p in D.PUBS if p.get("selected"))
    body = f"""        <section class="wrap page-head cv-head">
            <div>
                <h1>Curriculum Vitae</h1>
                <p class="lede">{D.PERSON['role']}, {D.PERSON['org']}. Ph.D., Texas A&amp;M University.</p>
            </div>
            <a class="button" href="assets/Ramy_Rady_CV.pdf" download>Download PDF</a>
        </section>
        <div class="wrap cv">
            <p class="muted small">PDF last updated {D.CV_UPDATED}.</p>
            <section id="experience" aria-labelledby="exp-h">
                <h2 id="exp-h">Experience</h2>
                <ol class="cv-list">
{exp}
                </ol>
            </section>
            <section id="education" aria-labelledby="edu-h">
                <h2 id="edu-h">Education</h2>
                <ol class="cv-list">
{edu}
                </ol>
            </section>
            <section aria-labelledby="hon-h">
                <h2 id="hon-h">Honors &amp; service</h2>
                <ul class="dated">
{honors}
                </ul>
            </section>
            <section aria-labelledby="media-h">
                <h2 id="media-h">Press</h2>
                <ul class="dated">
{media}
                </ul>
            </section>
            <section aria-labelledby="pub-h">
                <div class="block-head">
                    <h2 id="pub-h">Selected publications</h2>
                    <a class="more" href="publications.html">Full list →</a>
                </div>
                <ol class="pub-list">
{selected}
                </ol>
            </section>
            <section aria-labelledby="skills-h">
                <h2 id="skills-h">Tools</h2>
                <dl class="skills">
{skills}
                </dl>
            </section>
        </div>"""
    page("resume.html", "CV · Ramy Rady",
         "CV of Ramy Rady: SerDes analog/mixed-signal design at Apple; earlier work at Meta Reality Labs, Qualcomm, and Fraunhofer IIS; Ph.D. from Texas A&M.",
         body)


def build_redirects():
    for old, new in D.REDIRECTS.items():
        (ROOT / old).write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Moved · Ramy Rady</title>
    <meta name="robots" content="noindex">
    <link rel="canonical" href="{D.SITE_URL}/{new.split('#')[0]}">
    <meta http-equiv="refresh" content="0; url={new}">
</head>
<body>
    <p>This page has moved to <a href="{new}">{new}</a>.</p>
</body>
</html>
""")


def build_sitemap():
    pages = [("", "1.0"), ("research.html", "0.8"), ("publications.html", "0.8"), ("resume.html", "0.8")]
    urls = "\n".join(
        f"  <url>\n    <loc>{D.SITE_URL}/{p}</loc>\n    <lastmod>{D.UPDATED}</lastmod>\n    <priority>{pr}</priority>\n  </url>"
        for p, pr in pages
    )
    (ROOT / "sitemap.xml").write_text(
        f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n'
    )


if __name__ == "__main__":
    build_index()
    build_research()
    build_publications()
    build_resume()
    build_redirects()
    build_sitemap()
    print("Built", ", ".join(p for p, _ in NAV), "+", len(D.REDIRECTS), "redirects + sitemap.xml")
