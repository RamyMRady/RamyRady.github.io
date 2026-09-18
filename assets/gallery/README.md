# Gallery images

Drop photos here (`.jpg`, `.jpeg`, `.png`, `.webp`) and run `python3 _build/build.py`.
The Gallery page and its nav link appear automatically once at least one photo is here,
and disappear again if the folder is empty.

## Naming

The filename becomes the caption, so name files in plain words:

    tapeout-2023-mm-wave-receiver.jpg   ->  "Tapeout 2023 mm wave receiver"
    rww-2023-award.jpg                  ->  "Rww 2023 award"

Prefix a file with `award-` or `talk-` to file it under "Awards & talks";
anything else lands under "Chips & lab".

## Better captions (optional)

For titles and longer captions, add `captions.json` in this folder:

    {
      "tapeout-2023-mm-wave-receiver.jpg": {
        "title": "mm-Wave receiver, 65 nm CMOS",
        "caption": "Die photo of the CMOS/Si-photonics receiver front-end (RFIC 2023).",
        "group": "chips"
      },
      "award-rww-2023.jpg": {
        "title": "RWW 2023, best student paper finalist",
        "group": "awards"
      }
    }

Only include the keys you need. `group` is `chips` or `awards`.

## Before you publish

Check that each photo is yours to share: no employer-confidential layouts, and
no conference photos you do not hold the rights to.
