============================
Cloud Development Guidelines
============================

- All services must be runnable and testable locally. `Localstack <https://docs.localstack.cloud/overview/>`_ is preferred for running locally, but it can also be docker containers, custom plugins and mocks.
- As mentioned in the :doc:`Architecture <../architecture/Architecture>` doc, core features and application logic must be independent of cloud and infrastructure dependencies. There should not be any `import` statements from cloud specific service or `SKD` in the application layer.
- Interaction with all cloud services will be through interfaces and abstractions. The implementation should be injected from the outer layer to the application layer as mentioned in the :doc:`Coding Guidelines <./CodingGuideline>`. The type definition must be a reference of the abstraction, and not the implementation.
- All codes containing application logic must be placed in `core/application`. In other words, microservices inside the `core/services/<service_provider>/<service_name>` will only contain codes to expose the application logic through the cloud service provider, and nothing more. Unless it is a cloud specific implementation, or must import a dependency from the could service provider, it should be placed in the `application` directory.

AWS
~~~
- `AWS` specific microservices must be placed in `core/services/aws`.
- Lambdas of the service must be placed in `core/services/aws/<service_name>/lambdas`.
- Lambdas of the service that are connected to ApiGateway must be placed in `core/services/aws/<service_name>/lambdas/apiGateway`.