=================
Coding Guidelines
=================

Coding Standards
~~~~~~~~~~~~~~~~
The coding standards defined for this project is an adaptation of (though not applied *to the word* precisely) the theories of the book `Clean Code <https://www.goodreads.com/en/book/show/3735293>`_, by `Robert C. Martin <https://en.wikipedia.org/wiki/Robert_C._Martin>`_.

- The code should be readable like a piece of literature to a person familiar with the language in which the literature is written.
- Variable and function naming conventions should be maintained consistently. Every code block should scream out the intent of its existence.
- Commenting, indentation, vertical and horizontal formatting, argument count and argument type guidelines should be followed.
- Functions **cannot** be more than **25 lines**, preferred 10 lines or less.
- Classes **cannot** be more than **250 lines**, preferred 150 lines or less.
- Keep in mind that the above 2 points should not come at the cost of readability.
- Test coverage for each PR must be 60% minimum, 80% preferred. The infrastructure and documentation files are excluded from test coverage metrics.
- Architectural boundaries should be respected. No set of code in the inner circle will be dependent on any code in the outer circle (in reference to the `Clean Architecture Diagram <https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg>`_.
- `Design Patterns <https://en.wikipedia.org/wiki/Design_pattern>`_ should be used where applicable, but is should not come at the cost of manageability. Use your judgement to identify and apply the patterns.
- `SOLID principles <https://en.wikipedia.org/wiki/SOLID>`_ should be respected.
- Dependencies should be passed from the outer layer to the inner. References of interfaces should be used for type definition within the application layer, and not the implementation references. Avoid creating objects (`new` keyword) as much as possible within the application layer.

TS specific Guidelines
~~~~~~~~~~~~~~~~~~~~~~
- **Do not use** `any`, use `unknown` instead.
- **Do not use** `// @ts-ignore` unless absolutely necessary.
- Use `as` **only when sure** that type casting is safe.
- Use `never` where applicable.
- Use `type` to define data strictures and types; use `interface` to define behavioural abstractions.