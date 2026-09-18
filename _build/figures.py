"""Inline SVG block diagrams for the research themes.

Classes are styled in styles.css (.fig-*) so the drawings follow light/dark theme.
Electrical paths use the ink color; optical paths use the accent color.
"""

_DEFS = """<defs><marker id="ah-{id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 8 4 0 8Z" class="fig-head"/></marker><marker id="ao-{id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 8 4 0 8Z" class="fig-head-o"/></marker></defs>"""


def _svg(fid, label, inner):
    return (f'<svg class="fig" viewBox="0 0 340 190" role="img" aria-label="{label}">'
            + _DEFS.format(id=fid) + inner.replace("{id}", fid) + "</svg>")


def _antenna(x, y):
    return (f'<path class="fig-line" d="M{x} {y} v-22 M{x-9} {y-30} l9 8 9 -8"/>')


def _amp(x, y, w=26, label=""):
    t = f'<text class="fig-t" x="{x + w/2 - 3}" y="{y + 30}" text-anchor="middle">{label}</text>' if label else ""
    return f'<path class="fig-box" d="M{x} {y-13} L{x+w} {y} L{x} {y+13}Z"/>{t}'


def _box(x, y, w, h, label, sub=""):
    s = f'<text class="fig-t fig-sub" x="{x + w/2}" y="{y + h/2 + 13}" text-anchor="middle">{sub}</text>' if sub else ""
    ty = y + h / 2 + (0 if sub else 4)
    return (f'<rect class="fig-box" x="{x}" y="{y}" width="{w}" height="{h}" rx="4"/>'
            f'<text class="fig-t" x="{x + w/2}" y="{ty}" text-anchor="middle">{label}</text>{s}')


RECEIVER = _svg("rx", "Block diagram: antenna, LNA, and modulator on CMOS feed a silicon photonic ring filter bank, then a photodiode and TIA recover the selected channel", """
<rect class="fig-zone" x="8" y="40" width="104" height="120" rx="8"/>
<rect class="fig-zone fig-zone-o" x="118" y="40" width="132" height="120" rx="8"/>
<rect class="fig-zone" x="256" y="40" width="78" height="120" rx="8"/>
<text class="fig-cap" x="14" y="56">CMOS</text>
<text class="fig-cap fig-cap-o" x="124" y="56">Si photonics</text>
<text class="fig-cap" x="262" y="56">CMOS</text>
""" + _antenna(22, 108) + """
<path class="fig-line" d="M22 108 H34" marker-end="url(#ah-{id})"/>
""" + _amp(36, 108, 22, "LNA") + """
<path class="fig-line" d="M58 108 H72" marker-end="url(#ah-{id})"/>
""" + _box(74, 94, 32, 28, "MZM") + """
<text class="fig-t fig-sub" x="90" y="82" text-anchor="middle">laser</text>
<path class="fig-optical" d="M90 86 V94" marker-end="url(#ao-{id})"/>
<path class="fig-optical" d="M106 108 H258" marker-end="url(#ao-{id})"/>
<circle class="fig-ring" cx="152" cy="92" r="11"/>
<circle class="fig-ring" cx="184" cy="92" r="11"/>
<circle class="fig-ring" cx="216" cy="92" r="11"/>
<path class="fig-heater" d="M146 76 h12 M178 76 h12 M210 76 h12"/>
<text class="fig-t fig-sub" x="184" y="134" text-anchor="middle">tunable pole/zero filter</text>
<text class="fig-t fig-sub" x="184" y="146" text-anchor="middle">rejects blockers</text>
""" + _box(262, 96, 26, 24, "PD") + """
<path class="fig-line" d="M288 108 H294" marker-end="url(#ah-{id})"/>
""" + _amp(296, 108, 20, "TIA") + """
<path class="fig-line" d="M316 108 H330"/>
<text class="fig-t fig-sub" x="170" y="28" text-anchor="middle">RF → light → filtered in optics → back to RF</text>
""")

TUNING = _svg("tune", "Block diagram: a ring resonator with a heater is monitored by a photodiode; a TIA, ADC, ML controller and DAC close the loop to drive the heater", """
<path class="fig-optical" d="M20 52 H320" marker-end="url(#ao-{id})"/>
<circle class="fig-ring" cx="120" cy="80" r="22"/>
<path class="fig-heater" d="M104 108 h32"/>
<text class="fig-t fig-sub" x="120" y="124" text-anchor="middle">heater</text>
<text class="fig-t" x="120" y="84" text-anchor="middle">ring</text>
<path class="fig-optical" d="M230 52 V70" marker-end="url(#ao-{id})"/>
<text class="fig-t fig-sub" x="238" y="64">tap</text>
""" + _box(214, 72, 32, 24, "PD") + """
<path class="fig-line" d="M246 84 H262" marker-end="url(#ah-{id})"/>
""" + _amp(264, 84, 24) + """
<text class="fig-t fig-sub" x="276" y="72" text-anchor="middle">TIA</text>
<path class="fig-line" d="M288 84 H300 V130 H286" marker-end="url(#ah-{id})"/>
""" + _box(248, 118, 36, 24, "ADC") + """
<path class="fig-line" d="M248 130 H232" marker-end="url(#ah-{id})"/>
""" + _box(160, 114, 70, 32, "ML control", "μC") + """
<path class="fig-line" d="M160 130 H144 V148" marker-end="url(#ah-{id})"/>
""" + _box(126, 150, 36, 24, "DAC") + """
<path class="fig-line" d="M126 162 H90 V108 H102" marker-end="url(#ah-{id})"/>
<text class="fig-t fig-sub" x="170" y="28" text-anchor="middle">closed loop sets each pole/zero automatically</text>
""")

ROF = _svg("rof", "Block diagram: an RF signal drives a CMOS driver and Mach-Zehnder modulator; light travels over fiber to a remote antenna unit with a photodiode, amplifier and antenna", """
<rect class="fig-zone" x="8" y="44" width="130" height="110" rx="8"/>
<rect class="fig-zone fig-zone-o" x="214" y="44" width="120" height="110" rx="8"/>
<text class="fig-cap" x="14" y="60">Central office</text>
<text class="fig-cap fig-cap-o" x="220" y="60">Antenna unit</text>
<text class="fig-t fig-sub" x="14" y="100">RF</text>
<path class="fig-line" d="M16 110 H30" marker-end="url(#ah-{id})"/>
""" + _amp(32, 110, 26, "driver") + """
<path class="fig-line" d="M58 110 H74" marker-end="url(#ah-{id})"/>
""" + _box(76, 96, 50, 28, "MZM") + """
<text class="fig-t fig-sub" x="101" y="84" text-anchor="middle">laser</text>
<path class="fig-optical" d="M101 88 V96" marker-end="url(#ao-{id})"/>
<path class="fig-optical fig-fiber" d="M126 110 C150 80, 160 140, 180 110 S 205 90, 228 110" marker-end="url(#ao-{id})"/>
<text class="fig-t fig-sub" x="178" y="140" text-anchor="middle">fiber</text>
""" + _box(230, 96, 30, 28, "PD") + """
<path class="fig-line" d="M260 110 H272" marker-end="url(#ah-{id})"/>
""" + _amp(274, 110, 22, "PA") + """
<path class="fig-line" d="M296 110 H316"/>
""" + _antenna(316, 110) + """
<text class="fig-t fig-sub" x="170" y="28" text-anchor="middle">mm-wave carried over fiber to the antenna</text>
""")

LOWPOWER = _svg("lp", "Two block diagrams: a switched-capacitor DC-DC converter supplies a transmitter and antenna; a photodiode feeds an inverter-based TIA and equalizer", """
<text class="fig-cap" x="14" y="36">TX link</text>
""" + _box(14, 46, 64, 32, "SC DC–DC") + """
<path class="fig-line" d="M78 62 H96" marker-end="url(#ah-{id})"/>
""" + _box(98, 46, 50, 32, "VCO") + """
<path class="fig-line" d="M148 62 H166" marker-end="url(#ah-{id})"/>
""" + _amp(168, 62, 28, "PA") + """
<path class="fig-line" d="M196 62 H230"/>
""" + _antenna(230, 62) + """
<text class="fig-t fig-sub" x="290" y="66" text-anchor="middle">2 Mbps</text>
<path class="fig-rule" d="M14 104 H326"/>
<text class="fig-cap" x="14" y="128">Optical RX</text>
<path class="fig-optical" d="M14 156 H36" marker-end="url(#ao-{id})"/>
""" + _box(38, 142, 30, 28, "PD") + """
<path class="fig-line" d="M68 156 H86" marker-end="url(#ah-{id})"/>
""" + _box(88, 142, 70, 28, "inverter TIA") + """
<path class="fig-line" d="M158 156 H176" marker-end="url(#ah-{id})"/>
""" + _box(178, 142, 50, 28, "CTLE") + """
<path class="fig-line" d="M228 156 H246" marker-end="url(#ah-{id})"/>
<text class="fig-t fig-sub" x="290" y="152" text-anchor="middle">12.5 Gb/s</text>
<text class="fig-t fig-sub" x="290" y="166" text-anchor="middle">1.38 mW</text>
""")

FIGS = {"receiver": RECEIVER, "tuning": TUNING, "rof": ROF, "lowpower": LOWPOWER}

CAPTIONS = {
    "receiver": "Concept: the RF signal is moved onto light, filtered by tunable silicon photonic rings, and converted back by CMOS.",
    "tuning": "Concept: on-chip monitors and a controller set each ring's heater until the filter matches its target response.",
    "rof": "Concept: a radio-over-fiber link, from the CMOS modulator driver to the silicon photonic remote antenna unit.",
    "lowpower": "Concept: an ultra-low-power transmitter supplied by an integrated DC–DC converter, and an inverter-based optical receiver.",
}


# Chip-etching backdrop for the homepage terminal: a die with bond pads,
# routing traces and vias. Decorative, so it is aria-hidden in the markup.
CHIP_BG = """<svg class="chip-svg" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
  <defs>
    <pattern id="chip-grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path class="chip-grid-line" d="M40 0H0V40"/>
    </pattern>
    <radialGradient id="chip-glow" cx="50%" cy="50%" r="62%">
      <stop offset="0%" class="chip-glow-in"/>
      <stop offset="100%" class="chip-glow-out"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="420" fill="url(#chip-grid)"/>
  <rect width="1200" height="420" fill="url(#chip-glow)"/>

  <!-- dies sit left and right, clear of the terminal panel -->
  <g class="chip-die">
    <rect x="52" y="120" width="190" height="180" rx="10"/>
    <rect x="86" y="154" width="122" height="112" rx="6" class="chip-core"/>
    <rect x="958" y="120" width="190" height="180" rx="10"/>
    <rect x="992" y="154" width="122" height="112" rx="6" class="chip-core"/>
  </g>
  <g class="chip-pad">
    <rect x="30" y="142" width="18" height="8" rx="2"/><rect x="30" y="176" width="18" height="8" rx="2"/>
    <rect x="30" y="210" width="18" height="8" rx="2"/><rect x="30" y="244" width="18" height="8" rx="2"/>
    <rect x="30" y="278" width="18" height="8" rx="2"/>
    <rect x="246" y="142" width="18" height="8" rx="2"/><rect x="246" y="176" width="18" height="8" rx="2"/>
    <rect x="246" y="210" width="18" height="8" rx="2"/><rect x="246" y="244" width="18" height="8" rx="2"/>
    <rect x="246" y="278" width="18" height="8" rx="2"/>
    <rect x="936" y="142" width="18" height="8" rx="2"/><rect x="936" y="176" width="18" height="8" rx="2"/>
    <rect x="936" y="210" width="18" height="8" rx="2"/><rect x="936" y="244" width="18" height="8" rx="2"/>
    <rect x="936" y="278" width="18" height="8" rx="2"/>
    <rect x="1152" y="142" width="18" height="8" rx="2"/><rect x="1152" y="176" width="18" height="8" rx="2"/>
    <rect x="1152" y="210" width="18" height="8" rx="2"/><rect x="1152" y="244" width="18" height="8" rx="2"/>
    <rect x="1152" y="278" width="18" height="8" rx="2"/>
    <rect x="96" y="98" width="8" height="18" rx="2"/><rect x="136" y="98" width="8" height="18" rx="2"/>
    <rect x="176" y="98" width="8" height="18" rx="2"/>
    <rect x="96" y="304" width="8" height="18" rx="2"/><rect x="136" y="304" width="8" height="18" rx="2"/>
    <rect x="176" y="304" width="8" height="18" rx="2"/>
    <rect x="1002" y="98" width="8" height="18" rx="2"/><rect x="1042" y="98" width="8" height="18" rx="2"/>
    <rect x="1082" y="98" width="8" height="18" rx="2"/>
    <rect x="1002" y="304" width="8" height="18" rx="2"/><rect x="1042" y="304" width="8" height="18" rx="2"/>
    <rect x="1082" y="304" width="8" height="18" rx="2"/>
  </g>

  <!-- routing between the dies and off the edges -->
  <g class="chip-trace">
    <path d="M0 146h22"/><path d="M0 214h22"/><path d="M0 282h22"/>
    <path d="M264 146h96l30-30h120"/>
    <path d="M264 214h72l34 34h150"/>
    <path d="M264 282h130l26-26h110"/>
    <path d="M1200 146h-22"/><path d="M1200 214h-22"/><path d="M1200 282h-22"/>
    <path d="M936 146h-92l-28-28H700"/>
    <path d="M936 214h-70l-32 32H690"/>
    <path d="M936 282h-120l-24-24h-96"/>
    <path d="M100 98V44h240"/><path d="M180 322v54H420"/>
    <path d="M1006 98V44H770"/><path d="M1086 322v54H860"/>
  </g>
  <g class="chip-via">
    <circle cx="410" cy="116" r="4"/><circle cx="370" cy="248" r="4"/><circle cx="420" cy="256" r="4"/>
    <circle cx="790" cy="118" r="4"/><circle cx="834" cy="246" r="4"/><circle cx="792" cy="258" r="4"/>
    <circle cx="340" cy="44" r="4"/><circle cx="860" cy="376" r="4"/>
  </g>
</svg>"""

