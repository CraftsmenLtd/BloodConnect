# BloodConnect
BloodConnect

# Installation
- Clone the project.

## Git Setup
- Open the project in terminal/IDE.
- Execute `git config core.hooksPath .githooks` to change the git hooks to `.githooks` directory.
- Make the directory executable by executing `chmod +x .githooks/*`.

## Development Home
All documents are in docs directory. Please take a look at docs/README    
And there is a static site for dev docs: https://craftsmenltd.github.io/BloodConnect


## Local Doc build
Requirements: Docker need to be installed    
```shell
make sphinx-html
```
Then open `docs/_build/html/index.html` in a browser