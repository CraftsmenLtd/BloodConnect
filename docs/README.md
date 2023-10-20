# README

Welcome to BloodConnect README site. Please follow the sitemap for detailed information and guidelines.

## Documentation Guideline
For BloodConnect documentation we will use [reStructuredText](https://en.wikipedia.org/wiki/ReStructuredText) (RST, ReST or ReST)
with [Sphinx](https://www.sphinx-doc.org/en/master/). There are few reasons behind it:

- It is lightweight and better for technical documentation rather than Markdown
- Generate output of multiple types of documentation (HTML, PDF, LaTeX etc.)
- Math formula and better support for coding snippets
- Has built in support of using extensions

Learn reStructuredText with Sphinx: https://www.sphinx-doc.org/en/master/usage/restructuredtext/index.html

### API Documentation
For API documentation, [OpenAPI Specification](https://www.openapis.org/) formerly known as [Swagger Specification](https://swagger.io/docs/specification/about/) will be used.
The current latest version of OpenAPI is 3.1.0 and it will be used for BloodConnect. OpenAPI specs can be written using [JSON](https://www.json.org/json-en.html) or [YAML](https://yaml.org/) format but JSON is the selected one for this project.    

Learn OpenAPI specs

- OpenAPI official documentation: https://spec.openapis.org/oas/v3.1.0
- Swagger documentation: https://swagger.io/specification/

Things to consider during development

- OpenAPI specs must be updated if it is necessary with the project ticket
- Auto generate OpenAPI specs tools can be used. It is better to use such tools which will generate OpenAPI specs from code
- In CI pipeline, a step must be added to check validation of OpenAPI specs
- There should be commands to check validity of OpenAPI specs in local development environment

### Design tools and docs
[Figma](https://www.figma.com/) is being used for UI & UX design for this project. Figma publicly available http links will be attached to project design docs.
And project design docs is written using reStructuredText

### User Story
[Gherkin syntax](https://cucumber.io/docs/gherkin/) is being used for user story without and technical specification

### Graph and Flow diagrams
The initial plan is to use [Graphviz](https://graphviz.org/) for graph and flow diagrams. There are many tools to create, update, manage and visualize 
DOT Language.    

Learn DOT Language: https://graphviz.org/doc/info/lang.html

### End User Documentation
reStructuredText or HTML will be used and host as static site with the domain of BloodConnect 

### Readme, Code documentation and Pseudo code
[Markdown](https://www.markdownguide.org/)  will be used for these purposes

## Development Docs
- [System Architecture](./development/Architecture.md)
- [Ticket Lifecycle](./development/TicketLifecycle.md)
- [Coding Guideline](./development/CodingGuideline.md)
- [PR and Related Guideline](./development/PRGuideline.md)