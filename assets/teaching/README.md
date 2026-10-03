# Teaching materials

Each course has a folder named after its `slug` in `_build/data.py` (`TEACHING`),
for example `assets/teaching/ecen215/`. Drop files in and run `python3 _build/build.py`;
they appear as download links on `teaching.html`. Until a folder has files, the course
shows "Course materials will be posted here."

Accepted: `.pdf`, `.zip`, `.m`, `.py`, `.ipynb`, `.asc`, `.txt`.

## Naming

The first word of the filename picks the section, and the rest becomes the link text:

    syllabus-fall-2022.pdf          ->  Syllabus
    lecture-01-kcl-kvl.pdf          ->  Lecture slides
    lab-03-thevenin.pdf             ->  Lab handouts
    notes-phasor-examples.pdf       ->  Notes & worked examples
    anything-else.pdf               ->  Other

## Better titles (optional)

Add `materials.json` in the course folder:

    {
      "lecture-01-kcl-kvl.pdf": {
        "title": "Lecture 1: Kirchhoff's laws",
        "note": "Node and loop equations with three worked circuits."
      },
      "rc-demo.zip": { "kind": "lab", "title": "RC transient demo (LTspice)" }
    }

`kind` is one of `syllabus`, `lecture`, `lab`, `notes`, `other`.

## Before you publish

Post only material you wrote. Leave out exams, quiz and homework solutions, student
work or grades, and handouts written by other instructors or the department.
Textbook figures and publisher slides are copyrighted; redraw or cite them.
