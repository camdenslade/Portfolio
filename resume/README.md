# Resume

Source for Camden Slade's resume.

## Build

Requires a LaTeX distribution (TeX Live / MacTeX):

```sh
pdflatex CamdenSladeResume.tex
# or
latexmk -pdf CamdenSladeResume.tex
```

Produces `CamdenSladeResume.pdf`. The portfolio site serves its own copy at
`public/CamdenSladeResumeSeptember.pdf` (linked from the portfolio hero) — copy
the built PDF there when updating:

```sh
cp CamdenSladeResume.pdf ../public/CamdenSladeResumeSeptember.pdf
```
