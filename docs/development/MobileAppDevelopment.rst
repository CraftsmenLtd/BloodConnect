======================
Mobile App Development
======================

Run the App
~~~~~~~~~~~
Assuming 
- you've built the docker image already
- you've ran `run-command-install-node-modules`
.. include:: ../clients/mobile/.env.example
   :literal:
- you've setup the env variables in

Run the following commands to use expo development mode

 .. code-block:: bash

    make run-command-start-expo

Run this if you want to build the android app locally

 .. code-block:: bash

    make run-command-build-android-local

This will build the apk which you can install on your phone or an emulator
