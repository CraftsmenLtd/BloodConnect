=================
Setup the Project
=================

Git Setup
~~~~~~~~~
- `Install Git<https://git-scm.com/book/en/v2/Getting-Started-Installing-Git>`_ on your development environment.
- Clone the project.

.. code-block:: bash

    git clone git@github.com:CraftsmenLtd/BloodConnect.git

- Open the project in terminal/IDE.
- Execute `git config core.hooksPath .githooks` to change the git hooks to `.githooks` directory.
- Make the directory executable by executing `chmod +x .githooks/*`.

Installation
~~~~~~~~~~~~
- `Install Docker <https://docs.docker.com/engine/install/>`_ on your development environment
- Build docker image if not

.. code-block:: bash

    make build-runner-image

Additional Commands
~~~~~~~~~~~~~~~~~~~
- Lint: `npm run lint`
- Unit tests: Run the following commands from the root directory:

  - `npm run test`: all tests 
  - `npm run test -- <path_to_test_file>`: specific test file
  - `npm run test -- <path_to_test_file> -t <describe_text_in_test>`: specific test segment
