"""Site content. Every fact here is sourced from Ramy's CV (assets/Ramy_Rady_CV.pdf),
Google Scholar, or the publisher record behind each DOI. Edit here, then run:

    python3 _build/build.py
"""

SITE_URL = "https://www.ramyrady.com"
UPDATED = "2026-09-17"          # sitemap <lastmod>
CV_UPDATED = "August 2025"      # date printed on assets/Ramy_Rady_CV.pdf

PERSON = {
    "name": "Ramy Rady",
    "title": "Ph.D.",
    "role": "SerDes Analog/Mixed-Signal Design Engineer",
    "org": "Apple",
    "group": "Silicon Engineering Group",
    "location": "Cupertino, California",
    "email": "engramyrady@gmail.com",
    "scholar": "https://scholar.google.com/citations?user=sBTMlW4AAAAJ&hl=en",
    "linkedin": "https://www.linkedin.com/in/ramyrady/",
    "researchgate": "https://www.researchgate.net/profile/Ramy-Rady-2",
    "orcid": "https://orcid.org/0000-0001-6108-3645",
    "photo": "assets/profile-photo.jpg",
}

# Google Scholar profile totals, as read on the date below.
SCHOLAR_STATS = {"pubs": "20", "citations": "111", "h": "7", "as_of": "Sept 2026"}

# Homepage terminal: (command, output). Text also renders without JavaScript.
TERMINAL = [
    ("whoami",
     "Ramy Rady, Ph.D. — SerDes analog/mixed-signal design, Apple Silicon Engineering Group"),
    ("cat research/focus.txt",
     "mm-wave CMOS + silicon photonics, automatic tuning loops, radio-over-fiber links"),
    ("ls publications/ | wc -l",
     "20"),
    ("git log --oneline -1 phd",
     "2024  Texas A&amp;M University — automatically tunable mm-wave silicon photonic front-ends"),
]

# Gallery: photos are read from assets/gallery/ (see the README there).
GALLERY_GROUPS = [("chips", "Chips &amp; lab"), ("awards", "Awards &amp; talks")]

INTERESTS = [
    "High-speed SerDes analog front-ends",
    "Microwave & RF silicon photonics",
    "mm-wave CMOS / Si-photonics co-design",
    "Automatic tuning & calibration loops",
    "Radio-over-fiber links",
]

BIO = [
    "I design analog/mixed-signal circuits for high-speed SerDes transceivers in Apple's Silicon "
    "Engineering Group, where I work on transistor-level design, simulation, and lab validation "
    "of analog front-ends for Apple silicon.",
    "I received my Ph.D. in Electrical and Computer Engineering from Texas A&amp;M University in 2024, "
    "advised by Prof. Kamran Entesari and working closely with Prof. Samuel Palermo and Prof. Christi Madsen. "
    "My dissertation developed automatically tunable mm-wave silicon photonic beamformers and receiver "
    "front-ends, combining CMOS electronics with silicon photonic filters to build wideband, "
    "reconfigurable radios. Before that I interned at Meta Reality Labs and Qualcomm, and designed "
    "CMOS transceiver ICs at the Fraunhofer Institute for Integrated Circuits.",
]

# (date label, sort key, html)
NEWS = [
    ("2026", "2026-06", 'Invited feature in <em>IEEE Microwave Magazine</em> on microwave silicon photonic drivers and Mach–Zehnder modulators for radio-over-fiber links. <a href="publications.html#entesari2026mmm">Paper</a>'),
    ("May 2025", "2025-05", "Joined Apple's Silicon Engineering Group as a SerDes analog/mixed-signal design engineer."),
    ("Jan 2025", "2025-01", 'Preprint on gigahertz directional light modulation with electro-optic metasurfaces posted to arXiv. <a href="https://arxiv.org/abs/2501.06102" target="_blank" rel="noopener">arXiv</a>'),
    ("Jul 2024", "2024-07", 'Ultra-wideband mm-wave remote antenna unit for radio-over-fiber systems published in <em>Optics Express</em>. <a href="publications.html#rady2024oe">Paper</a>'),
    ("May 2024", "2024-05", "Completed my Ph.D. at Texas A&amp;M University."),
    ("May 2024", "2024-05b", 'Hybrid-integrated heterodyning software-defined radio receiver published in <em>IEEE TMTT</em>. <a href="publications.html#rady2024tmtt">Paper</a>'),
    ("Feb 2024", "2024-02", "Received the ISSCC 2024 Student Travel Grant."),
    ("Jun 2023", "2023-06", 'Presented a CMOS/Si-photonics receiver with &gt;80 dB blocker rejection at IEEE RFIC 2023, and was a Three-Minute Thesis finalist. <a href="publications.html#rady2023rfic">Paper</a>'),
    ("May 2023", "2023-05", "Started a research scientist internship at Meta Reality Labs on CMOS drivers and stabilization loops."),
    ("Jan 2023", "2023-01", "Best Student Paper Award finalist at IEEE Radio &amp; Wireless Week (RWW) 2023."),
    ("Jul 2021", "2021-07", 'My 25–40 GHz silicon photonic receiver was featured by <a href="https://engineering.tamu.edu/news/2021/07/doctoral-student-bridges-gap-between-electronics-and-optics.html" target="_blank" rel="noopener">Texas A&amp;M Engineering</a> and <a href="https://www.kbtx.com/2021/08/04/texas-am-doctoral-student-designs-chip-capable-revolutionizing-data-processing-rates/" target="_blank" rel="noopener">KBTX</a>.'),
]

HONORS = [
    ("2024", "ISSCC Student Travel Grant"),
    ("2023", "Best Student Paper Award Finalist, IEEE Radio &amp; Wireless Week (RWW)"),
    ("2023", '<a href="research.html#talks">Three-Minute Thesis Finalist</a>, IEEE RFIC Symposium'),
    ("2019–2024", "Graduate Research Scholarship and Quality Graduate Student Award, Texas A&amp;M"),
    ("2019–2024", '<a href="teaching.html">Graduate Assistant Lecturer</a> teaching fellowship, Texas A&amp;M'),
    ("During Ph.D.", "IEEE MTT-S Student Ambassador"),
]

# Teaching. Course facts are from the Texas A&M catalog; the role from the CV.
# Downloadable files are read from assets/teaching/<slug>/ (see the README there).
TEACHING = [
    {
        "slug": "ecen215",
        "code": "ECEN 215",
        "title": "Principles of Electrical Engineering",
        "org": "Texas A&amp;M University",
        "dept": "Department of Electrical &amp; Computer Engineering",
        "when": "2019–2024",
        "role": "Graduate Assistant Lecturer",
        "about": "Fundamentals of electric circuit analysis and an introduction to electronics, "
                 "for engineering majors outside electrical and computer engineering.",
        "facts": [
            ("Format", "3 credits: 2 hours of lecture and 2 hours of lab each week"),
            ("Audience", "Undergraduate engineering majors other than ECE"),
            ("Prerequisites", "MATH 251 or 253, and PHYS 207 or 208"),
            ("Taught", "Spring 2022 lectures; instructor of record in Spring 2024 (sections 501–503)"),
            ("Textbook", "Allan R. Hambley, <em>Electrical Engineering: Principles and Applications</em>, 7th ed."),
        ],
        # Lectures I wrote: (number, title, icon, file). Files live in assets/teaching/<slug>/lectures/;
        # icons are drawn in build.py (LECTURE_ICONS).
        "lectures_credit": "Slides by Ramy Rady.",
        "lectures": [
            ("DC circuits", [
                (1, "Introduction to electrical engineering", "bolt", "lecture-01-introduction-to-electrical-engineering.pdf"),
                (2, "Voltage, current, power, and the passive sign convention", "source", "lecture-02-voltage-current-power.pdf"),
                (3, "Sources, Kirchhoff's laws, and voltage and current dividers", "divider", "lecture-03-kirchhoffs-laws-dividers.pdf"),
                (6, "Thevenin, Norton, and power transfer", "thevenin", "lecture-06-thevenin-norton-power-transfer.pdf"),
                (8, "Resistive circuits revision: worked examples", "mesh", "lecture-08-resistive-circuits-revision.pdf"),
            ]),
            ("Capacitors, inductors, and transients", [
                (7, "Capacitors and inductors: switched-circuit examples", "inductor", "lecture-07-capacitors-inductors-examples.pdf"),
                (12, "Capacitors, inductors, and transient response", "capacitor", "lecture-12-capacitors-inductors-transients.pdf"),
                (13, "Step and natural response of RC and RL circuits", "step", "lecture-13-step-natural-response.pdf"),
            ]),
        ],
    },
]

# Recorded talks, embedded on the Research page. "youtube" is the video ID.
TALKS = [
    {
        "youtube": "PKXa2FhZcvg",
        "title": "My Ph.D. research in three minutes",
        "event": "Three-Minute Thesis (3MT&reg;) finalist, IEEE Microwave Week 2023",
        "source": "IEEE Microwave Theory and Technology Society",
    },
]

TEACHING_EARLIER = [
    ("2015–2017", "Teaching and Research Assistant, undergraduate microelectronic circuits, Istanbul Sehir University"),
]

MEDIA = [
    ("Jul 2021", "Texas A&amp;M Engineering", "Doctoral student bridges gap between electronics and optics",
     "https://engineering.tamu.edu/news/2021/07/doctoral-student-bridges-gap-between-electronics-and-optics.html"),
    ("Aug 2021", "KBTX News", "Texas A&amp;M doctoral student designs chip capable of revolutionizing data processing rates",
     "https://www.kbtx.com/2021/08/04/texas-am-doctoral-student-designs-chip-capable-revolutionizing-data-processing-rates/"),
]

EXPERIENCE = [
    {
        "when": "May 2025 – Present", "org": "Apple", "unit": "Silicon Engineering Group · Cupertino, CA",
        "role": "SerDes Transceiver Analog/Mixed-Signal Design Engineer",
        "points": [
            "Design next-generation high-speed SerDes IP for Apple silicon SoCs.",
            "Own transistor-level design, simulation, and validation of analog front-end (AFE) and digital circuits.",
            "Work with PHY, packaging, and system teams to optimize performance and power.",
            "Contributed to shipping silicon, including lab characterization and correlation with simulation.",
        ],
    },
    {
        "when": "May 2023 – Aug 2023", "org": "Meta Reality Labs", "unit": "Washington, USA",
        "role": "Research Scientist Intern, CMOS Drivers &amp; Stabilization Loops",
        "points": [
            "Designed driver and TIA electronics in 130 nm CMOS to control and stabilize a zonal-illumination photonic chip.",
            "Improved AR/VR display efficiency and reduced power consumption.",
            "Filed three patent applications: laser driver, MEMS driver, and auto-stabilizer.",
        ],
    },
    {
        "when": "Jan 2019 – Apr 2024", "org": "Texas A&amp;M University", "unit": "College Station, TX",
        "role": "Graduate Research Assistant, RF Silicon Photonics",
        "points": [
            "Took mm-wave CMOS and silicon photonic systems from modeling and design through tape-out and characterization.",
            "Built automatic bias-control and stabilization loops (TIA, ADC, DAC, microcontroller) running ML-based tuning.",
            "Developed an ML algorithm that dynamically adjusts filter pole locations.",
            "Wrote five research proposals to funding agencies.",
        ],
    },
    {
        "when": "May 2020 – Aug 2020", "org": "Qualcomm", "unit": "Dallas, TX",
        "role": "Design Engineering Intern, mm-Wave IC R&amp;D",
        "points": [
            "Designed mm-wave power amplifiers.",
            "Built a calculator to estimate PA lifetime (reliability).",
        ],
    },
    {
        "when": "May 2017 – Nov 2018", "org": "Fraunhofer Institute for Integrated Circuits", "unit": "Bavaria, Germany",
        "role": "R&amp;D Engineer, CMOS ICs for Automotive AR",
        "points": [
            "Taped out a 10 GHz transceiver and PLL chip for in-vehicle AR technology.",
        ],
    },
]

EDUCATION = [
    ("2019 – 2024", "Ph.D., Electrical and Computer Engineering", "Texas A&amp;M University",
     "Advisor: Prof. Kamran Entesari. Dissertation: <em>Automatically Tunable Mm-Wave Silicon Photonics Beamformers and Front-Ends for Wideband High Performance Radio Transceivers</em>."),
    ("2015 – 2017", "M.Sc., Electronics and Computer Engineering", "Istanbul Şehir University, Turkey",
     "GPA 4.0/4.0. Thesis: <em>Ultra-Low Power, Low-Voltage Transmitter at ISM Band for Short Range Transceivers</em>."),
    ("2008 – 2013", "B.Sc., Electronics and Communications Engineering", "Ain Shams University, Cairo, Egypt",
     "Graduated with honors. Graduation project: Smart Dust low-power PLL and receiver at 902 MHz (grade: Excellent)."),
]

SKILLS = [
    ("Circuit design", "Cadence Virtuoso (schematic, layout, ADE), Verilog-A/AMS"),
    ("EM &amp; RF simulation", "Ansys HFSS, Sonnet, Keysight ADS, Microwave Office"),
    ("Programming", "Python (incl. ML), C/C++, MATLAB, Arduino"),
    ("Scripting", "Tcl/Tk, Perl"),
]

# Venue short names shown as badges.
# kind: journal | conference | preprint | thesis
PUBS = [
    dict(key="entesari2026mmm", kind="journal", badge="MWM", year=2026,
         authors=["K. Entesari", "S. Palermo", "C. K. Madsen", "D. Paladugu", "Y.-L. Luo", "H. Yu", "R. Rady"],
         title="Microwave Silicon Photonics Drivers/Mach–Zehnder Modulators for Radio-Over-Fiber Links",
         venue="IEEE Microwave Magazine", pages="2–25", doi="10.1109/MMM.2026.3683640", theme="rof"),
    dict(key="lin2025arxiv", kind="preprint", badge="arXiv", year=2025,
         authors=["S. Lin", "Y. Chen", "T. Hwang", "A. Upadhyay", "R. Rady", "D. Dolt", "S. Palermo", "K. Entesari", "C. Madsen", "Z. J. Wong", "S. Lan"],
         title="Gigahertz Directional Light Modulation with Electro-Optic Metasurfaces",
         venue="arXiv preprint arXiv:2501.06102", url="https://arxiv.org/abs/2501.06102", eprint="2501.06102"),
    dict(key="rady2024tmtt", kind="journal", badge="TMTT", year=2024, month="May", selected=True,
         authors=["R. Rady", "Y.-L. Luo", "C. Madsen", "S. Palermo", "K. Entesari"],
         title="An mm-Wave CMOS/Si-Photonics Reconfigurable Hybrid-Integrated Heterodyning Software-Defined Radio Receiver",
         venue="IEEE Transactions on Microwave Theory and Techniques", volume="72", number="5", pages="2824–2839",
         doi="10.1109/TMTT.2024.3371914", theme="receivers"),
    dict(key="rady2024oe", kind="journal", badge="OE", year=2024, month="Jul", selected=True,
         authors=["R. Rady", "C. Madsen", "S. Palermo", "K. Entesari"],
         title="Ultra-Wideband mm-Wave Remote Antenna Unit for Radio-over-Fiber Distributed Antenna Systems in Silicon Photonics",
         venue="Optics Express", volume="32", number="15", pages="25953", doi="10.1364/OE.527239", theme="rof",
         open_access=True),
    dict(key="luo2024jlt", kind="journal", badge="JLT", year=2024, month="Dec",
         authors=["Y.-L. Luo", "D. Paladugu", "R. Rady", "C. Madsen", "K. Entesari", "S. Palermo"],
         title="A 16–32 GHz RF Photonic Front-End With 22 nm CMOS Driver and Silicon Travelling-Wave Mach-Zehnder Modulator",
         venue="Journal of Lightwave Technology", volume="42", number="23", pages="8127–8136",
         doi="10.1109/JLT.2024.3427128", theme="rof"),
    dict(key="yan2024aicsp", kind="journal", badge="AICSP", year=2024, month="Feb",
         authors=["P. Yan", "C. Hong", "P.-H. Chang", "H. Kang", "D. Annabattuni", "A. Kumar", "Y.-H. Fan", "R. Liu", "R. Rady", "S. Palermo"],
         title="A 12.5 Gb/s 1.38 mW All-Inverter-Based Optical Receiver with Multi-Stage Feedback TIA and Continuous-Time Linear Equalizer",
         venue="Analog Integrated Circuits and Signal Processing", volume="119", number="2", pages="283–296",
         doi="10.1007/s10470-024-02248-1", theme="lowpower"),
    dict(key="rady2024phd", kind="thesis", badge="Ph.D.", year=2024,
         authors=["R. Rady"],
         title="Automatically Tunable Mm-Wave Silicon Photonics Beamformers and Front-Ends for Wideband High Performance Radio Transceivers",
         venue="Ph.D. dissertation, Texas A&amp;M University", school="Texas A&M University", theme="tuning"),
    dict(key="rady2023jlt", kind="journal", badge="JLT", year=2023, month="Mar", selected=True,
         authors=["R. Rady", "C. Madsen", "S. Palermo", "K. Entesari"],
         title="A 20–43.5-GHz Wideband Tunable Silicon Photonic Receiver Front-End for mm-Wave Channel Selection/Jammer Rejection",
         venue="Journal of Lightwave Technology", volume="41", number="5", pages="1309–1324",
         doi="10.1109/JLT.2022.3222192", theme="receivers"),
    dict(key="luo2023tmtt", kind="journal", badge="TMTT", year=2023, month="Mar", selected=True,
         authors=["Y.-L. Luo", "R. Rady", "K. Entesari", "S. Palermo"],
         title="A Power-Efficient 20–35-GHz MZM Driver With Programmable Linearizer for Analog Photonic Links in 28-nm CMOS",
         venue="IEEE Transactions on Microwave Theory and Techniques", volume="71", number="3", pages="1262–1273",
         doi="10.1109/TMTT.2022.3218051", theme="rof"),
    dict(key="rady2023rfic", kind="conference", badge="RFIC", year=2023, month="Jun", selected=True,
         authors=["R. Rady", "Y.-L. Luo", "C. Madsen", "S. Palermo", "K. Entesari"],
         title="A mm-Wave CMOS/Si-Photonics Hybrid-Integrated Software-Defined Radio Receiver Achieving &gt;80-dB Blocker Rejection of &lt;−10 dBm In-Band Blockers",
         venue="IEEE Radio Frequency Integrated Circuits Symposium (RFIC)", pages="261–264",
         doi="10.1109/RFIC54547.2023.10186186", theme="receivers"),
    dict(key="luo2023ipc", kind="conference", badge="IPC", year=2023, month="Nov",
         authors=["Y.-L. Luo", "D. Paladugu", "R. Rady", "K. Entesari", "S. Palermo"],
         title="A 16–32 GHz RF Silicon Photonic Receiver with 22 nm FD-SOI CMOS Driver",
         venue="IEEE Photonics Conference (IPC)", pages="1–2", doi="10.1109/IPC57732.2023.10360718", theme="rof"),
    dict(key="entesari2023wamicon", kind="conference", badge="WAMICON", year=2023, month="Apr",
         authors=["K. Entesari", "R. Rady", "S. Palermo", "C. Madsen"],
         title="Millimeter-Wave Silicon Photonics Circuits with Automatic Calibration for Wireless Communications",
         venue="IEEE Wireless and Microwave Technology Conference (WAMICON)", pages="37–40",
         doi="10.1109/WAMICON57636.2023.10124901", theme="tuning"),
    dict(key="rady2023sirf", kind="conference", badge="SiRF", year=2023, month="Jan", selected=True,
         authors=["R. Rady", "C. K. Madsen", "S. Palermo", "K. Entesari"],
         title="Automatic Tuning of Microwave Silicon Photonic Ring Resonators",
         venue="IEEE Topical Meeting on Silicon Monolithic Integrated Circuits in RF Systems (SiRF), Radio &amp; Wireless Week",
         pages="55–57", doi="10.1109/SiRF56960.2023.10046254", theme="tuning"),
    dict(key="rady2022mwp", kind="conference", badge="MWP", year=2022, month="Oct",
         authors=["R. Rady", "C. Madsen", "S. Palermo", "K. Entesari"],
         title="A Silicon Photonics Automatically-Tunable mm-Wave Remote Antenna Unit",
         venue="IEEE International Topical Meeting on Microwave Photonics (MWP)", pages="1–4",
         doi="10.1109/MWP54208.2022.9997602", theme="rof"),
    dict(key="yan2022mwscas", kind="conference", badge="MWSCAS", year=2022, month="Aug",
         authors=["P. Yan", "C. Hong", "P.-H. Chang", "H. Kang", "D. Annabattuni", "A. Kumar", "Y.-H. Fan", "R. Liu", "R. Rady", "S. Palermo"],
         title="A 12.5 Gb/s 1.38 mW Inverter-Based Optical Receiver in 28 nm CMOS",
         venue="IEEE International Midwest Symposium on Circuits and Systems (MWSCAS)", pages="1–4",
         doi="10.1109/MWSCAS54063.2022.9859536", theme="lowpower"),
    dict(key="entesari2022ofc", kind="conference", badge="OFC", year=2022,
         authors=["K. Entesari", "S. Palermo", "C. Madsen", "G. Choo", "R. Rady", "S. Cai", "B. Wang"],
         title="Automated Tuning for Silicon Photonic Filters",
         venue="Optical Fiber Communication Conference (OFC)", pages="Th1D.6",
         doi="10.1364/OFC.2022.Th1D.6", theme="tuning"),
    dict(key="rady2021ims", kind="conference", badge="IMS", year=2021, month="Jun",
         authors=["R. Rady", "C. K. Madsen", "S. Palermo", "K. Entesari"],
         title="A 25–40 GHz Wideband Tunable Silicon Photonic Reconfigurable Receiver Front-End for mm-Wave Channel Selection/Jammer Rejection",
         venue="IEEE MTT-S International Microwave Symposium (IMS)", pages="304–306",
         doi="10.1109/IMS19712.2021.9574992", theme="receivers"),
    dict(key="rady2021ofc", kind="conference", badge="OFC", year=2021,
         authors=["R. Rady", "G. Choo", "C. Madsen", "S. Palermo", "K. Entesari"],
         title="External Modulator-Based Automatic Tuning of Reconfigurable Silicon Photonic 4th-Order APF-Based Pole/Zero Filters",
         venue="Optical Fiber Communication Conference (OFC)", pages="Th4B.6",
         doi="10.1364/OFC.2021.Th4B.6", theme="tuning"),
    dict(key="luo2021ofc", kind="conference", badge="OFC", year=2021,
         authors=["Y.-L. Luo", "A. Ershadi", "R. Rady", "K. Entesari", "S. Palermo"],
         title="A Power-Efficient 20–35 GHz MZM Driver with Programmable Linearizer in 28 nm CMOS",
         venue="Optical Fiber Communication Conference (OFC)", pages="Tu5F.5",
         doi="10.1364/OFC.2021.Tu5F.5", theme="rof"),
    dict(key="rady2020tcas", kind="journal", badge="TCAS-II", year=2020, month="Oct",
         authors=["R. Rady", "H. Dogan", "M. Aktan", "S. A. Mohammed", "M. T. Ozgun"],
         title="An Ultra Low Power Integrated Radio TX Link Supplied From a Switched Capacitor DC–DC Converter in 65-nm CMOS Achieving 2 Mbps",
         venue="IEEE Transactions on Circuits and Systems II: Express Briefs", volume="67", number="10", pages="1899–1903",
         doi="10.1109/TCSII.2019.2957009", theme="lowpower"),
]

# Research themes. Each lists only results stated in the paper titles or press coverage.
THEMES = [
    dict(
        id="receivers", figure="receiver",
        title="Wideband mm-wave CMOS / silicon photonic receivers",
        summary="Radios for 5G and beyond must pick a narrow channel out of tens of gigahertz of spectrum while strong "
                "interferers sit nearby. Filtering at mm-wave frequencies is lossy and hard to tune in CMOS alone. "
                "I moved the filtering into the optical domain: the RF signal is modulated onto light, "
                "shaped by reconfigurable silicon photonic filters, and converted back by CMOS electronics.",
        results=[
            "25–40 GHz tunable receiver front-end selecting four 5 GHz-wide channels (IMS 2021)",
            "Front-end extended to 20–43.5 GHz for channel selection and jammer rejection (JLT 2023)",
            "Hybrid-integrated CMOS/Si-photonics software-defined radio receiver with &gt;80 dB rejection of &lt;−10 dBm in-band blockers (RFIC 2023)",
            "Reconfigurable heterodyning receiver architecture (TMTT 2024)",
        ],
    ),
    dict(
        id="tuning", figure="tuning",
        title="Automatic tuning of silicon photonic filters",
        summary="Silicon ring resonators shift with fabrication variation, temperature, and thermal crosstalk, so a "
                "filter that works on paper rarely works out of the box. I built closed-loop calibration: on-chip "
                "monitors, a TIA/ADC/DAC/microcontroller loop, and ML-based algorithms that set heater biases "
                "and place the filter's poles and zeros automatically.",
        results=[
            "External-modulator-based tuning of 4th-order all-pass-filter pole/zero filters (OFC 2021)",
            "Automated tuning for silicon photonic filters (OFC 2022)",
            "Automatic tuning of microwave silicon photonic ring resonators (SiRF 2023)",
            "mm-wave silicon photonic circuits with automatic calibration (WAMICON 2023)",
        ],
    ),
    dict(
        id="rof", figure="rof",
        title="Radio-over-fiber links and microwave photonic drivers",
        summary="Distributed antenna systems carry mm-wave signals over fiber to remote antenna units. That needs "
                "wideband, linear electro-optic conversion at the antenna and efficient CMOS drivers for the "
                "modulators. This work spans the remote antenna unit itself and the Mach–Zehnder modulator "
                "drivers that feed it.",
        results=[
            "Automatically tunable mm-wave remote antenna unit (MWP 2022)",
            "Ultra-wideband remote antenna unit for radio-over-fiber distributed antenna systems (Optics Express 2024)",
            "Power-efficient 20–35 GHz MZM driver with programmable linearizer in 28 nm CMOS (OFC 2021, TMTT 2023)",
            "16–32 GHz RF photonic front-end with 22 nm CMOS driver and travelling-wave MZM (IPC 2023, JLT 2024)",
            "Invited review of microwave silicon photonic drivers and MZMs (IEEE Microwave Magazine 2026)",
        ],
    ),
    dict(
        id="lowpower", figure="lowpower",
        title="Energy-efficient CMOS transceivers",
        summary="Earlier work focused on how little power a link can use. That includes a short-range transmitter "
                "supplied directly from an integrated switched-capacitor DC–DC converter (my M.Sc. thesis), and "
                "inverter-based optical receivers for wireline links.",
        results=[
            "Ultra-low-power 65 nm CMOS radio TX link powered by a switched-capacitor DC–DC converter, achieving 2 Mbps (TCAS-II 2020)",
            "12.5 Gb/s, 1.38 mW inverter-based optical receiver in 28 nm CMOS (MWSCAS 2022, AICSP 2024)",
        ],
    ),
]

# Old URLs that now live elsewhere; build.py writes a redirect page for each.
REDIRECTS = {
    "about.html": "index.html#about",
    "contact.html": "index.html#contact",
    "experience.html": "resume.html#experience",
    "projects.html": "research.html",
    "project-silicon-photonic-filters.html": "research.html#tuning",
    "project-ml-control.html": "research.html#tuning",
    "project-mmwave-receivers.html": "research.html#receivers",
    "project-optical-receivers.html": "research.html#lowpower",
    "project-rf-transmitters.html": "research.html#lowpower",
    "project-arvr-drivers.html": "resume.html#experience",
    "note-dont-add-db.html": "note-noise-figure.html#db-arithmetic",
    "note-kt-floor.html": "note-noise-figure.html#sensitivity",
}
