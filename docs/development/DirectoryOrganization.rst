======================
Directory Organization
======================

Please go through the :doc:`Architecture <./Architecture>` and the :doc:`Cloud Development Guidelines <./CloudDevGuideline>` for understanding the motivation behind the directory organization.

 .. code-block::

    BloodConnect
    └── clients
        ├── mobile
        └── web
    |── commons
    └── core
        ├── application
        └── services
            ├── aws
            |   |── <list_of_services>
            |   └── commons
            └── gCloud

- **clients**: Contains client side code for mobile and web.
- **commons**: Contains common definitions and libraries to be used by both core and clients.
- **core**: Contains all the server side implementations, logics and services.
- **application**: Contains all *application/business logic* of the system. This is the default place where all the codes will reside, unless there is a reason to put it elsewhere. It will contain all the *application logic*, that is not coupled to infrastructure or i/o. All codes here can be imported and reused in other modules and services. As mentioned in the `Architecture` document, the directory structure here will reflect the use cases of the system, not the tech or tool or anything in the i/o periphery.
- **services**: Contains microservices organized in different cloud solution/hosting providers. This is the place where the application layer logics will be exposed to be used through the infrastructure. Currently, only `aws` implementation is added here, but similar implementations for other providers can be added here.
- **<service_provider>/commons**: Contains the common libraries and dependencies across services to be used by the different services; that are coupled with the hosting/cloud service provider.