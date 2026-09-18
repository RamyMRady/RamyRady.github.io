# ramyrady.com

Personal research website of Ramy Rady, Ph.D., served by GitHub Pages from `main`.

## Editing content

All pages are generated from one data file, so every page stays consistent.

1. Edit `_build/data.py`. It holds the bio, news, publications, research themes, CV entries, and honors.
2. Run `python3 _build/build.py`.
3. Commit the regenerated HTML files together with your data change.

Examples:

- **Add a paper:** add an entry to `PUBS` (use `selected=True` to feature it on the homepage).
- **Add news:** add a line to `NEWS`. It is sorted by the second field (`YYYY-MM`).
- **Update the CV PDF:** replace `assets/Ramy_Rady_CV.pdf` and set `CV_UPDATED`.
- **Add gallery photos:** drop images into `assets/gallery/` and rebuild. The Gallery page
  and its nav link appear automatically once the folder has at least one photo, and vanish
  if you empty it. See `assets/gallery/README.md` for naming and optional captions.

Only rebuild the link-preview image (`assets/og-image.png`) when the name, title, or photo changes. It requires `pip install playwright`:

```
python3 _build/og_image.py
```

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | About, news, research overview, selected publications, honors, contact |
| `research.html` | Research themes with diagrams and key results |
| `publications.html` | Full list by year, with filters, DOI links, and BibTeX |
| `resume.html` | CV |
| `gallery.html` | Chips, lab and award photos (only built when `assets/gallery/` has images) |
| `styles.css`, `script.js` | Shared styles (light/dark) and behavior |
| `_build/` | Content and generator (Jekyll does not publish `_` folders) |
| `about.html`, `project-*.html`, … | Redirects from older URLs |
