=================
Setup the Project
=================

Installation
~~~~~~~~~~~~
- Clone the project.
- Install `npm`
- Install `node18x` (added in .nvmrc)
- From project root, execute `npm i`. `npm ci` can be used if preferred, if the `package.lock.json` is available.
- Run `npm i` in the folders containing `package.json` to install all dependencies. `npm ci` can be used if preferred, and the `package.lock.json` is available. To run specific services/sub-modules, enter the directory containing the `package.json` file of that service/sub-module and execute the command. Currently, the following folders contain a `package.json` file:

  - root
  - core/application
  - core/services/<cloud_provider>
  - core/services/<cloud_provider>/<service_name> if needed

Additional Commands
~~~~~~~~~~~~~~~~~~~
- Lint: `npm run lint`
- Unit tests: Run the following commands from the root directory:

  - `npm run test`: all tests 
  - `npm run test -- <path_to_test_file>`: specific test file
  - `npm run test -- <path_to_test_file> -t <describe_text_in_test>`: specific test segment

Building and Bundling
^^^^^^^^^^^^^^^^^^^^^
- Services: Run the following commands from `core/services/<cloud_provider>`. The generated files are placed inside `core/services/<cloud_provider>/.build`.

  - `npm run build-service --name=<service_name>`: specific service.
  - `npm run build-all`: all services.
  - `npm run package-service --name=<service_name>`: creates zip files for the particular service to be deployed to cloud in `.build/zips`.
  - `npm run package-all`: creates zip files for all services to be deployed to cloud in `.build/zips`.

Git Setup
~~~~~~~~~
- Open the project in terminal/IDE.
- Execute `git config core.hooksPath .githooks` to change the git hooks to `.githooks` directory.
- Make the directory executable by executing `chmod +x .githooks/*`.
