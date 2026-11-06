# Resume

Source for Camden Slade's resume.

## Build

Requires a LaTeX distribution (TeX Live / MacTeX):

```sh
pdflatex CamSladeResumeOct.tex
# or
latexmk -pdf CamSladeResumeOct.tex
```

Produces `CamSladeResumeOct.pdf`. The portfolio site serves its own copy at
`public/CamSladeResumeOctSeptember.pdf` (linked from the portfolio hero) — copy
the built PDF there when updating:

```sh
cp CamSladeResumeOct.pdf ../public/CamSladeResumeOctSeptember.pdf
```
