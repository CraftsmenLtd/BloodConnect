============================
Cloud Development Guidelines
============================

- All services must be runnable and testable locally. `Localstack <https://docs.localstack.cloud/overview/>`_ is preferred for running locally, but it can also be docker containers, custom plugins and mocks.
- As mentioned in the :doc:`Architecture <./Architecture>` doc, core features and application logic must be independent of cloud and infrastructure dependencies. There should not be any `import` statements from cloud specific service or `SKD` in the application layer.
- Interaction with all cloud services will be through interfaces and abstractions. The implementation should be injected from the outer layer to the application layer as mentioned in the :doc:`Coding Guidelines <./CodingGuideline>`. The type definition must be a reference of the abstraction, and not the implementation.