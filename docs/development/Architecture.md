# System Architecture

## Architectural pattern
[Headless](https://www.infosys.com/services/digital-commerce/documents/headless-architecture.pdf)

## System Design
The system design takes motivation from [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) by [Robert C. Martin](https://en.wikipedia.org/wiki/Robert_C._Martin).

<img src="https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg">

<br/>

- Clear separation between layers through abstractions and policies.
- All modules will be independently buildable, runnable, deployable.
- Application core/business logic will strictly remain within the application layer (the `Use Cases` layer in the above diagram). Dependency on tools, infrastructure, storage, 3rd party (libraries, APIs, services etc) will be separated by abstraction.
- Communication between layers are done using DTOs ([Data Transfer Objects](https://en.wikipedia.org/wiki/Data_transfer_object))

## Code Organization
- All the codes are organized in a single repository in different directories ([MonoRepo](https://en.wikipedia.org/wiki/Monorepo)). 
- The backend is broken into several [microservices](https://en.wikipedia.org/wiki/Microservices).
- The directory structure should be organized according to use cases. It should scream out the business purpose, not the technical specifications or frameworks. It should be obvious from the first look of the directory structure that the system exists to facilitate use cases of blood donation, not language, infrastructure, tools or other technical specifications. 
- The common functionalities between client side components are managed in a `common` place, from where they are imported and used.
- All the common functionalities and data structures (DTOs) between shared modules are managed in a `common` place, from where they are imported and used.
