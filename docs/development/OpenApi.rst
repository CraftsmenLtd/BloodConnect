Guideline
~~~~~~~~~
* Use `camelCase` for query parameters, api payloads and custom headers
* Use hyphen in API urls

OpenAPI Specs
~~~~~~~~~~~~~

.. raw:: html

   Check out the open api specs <a href="../openapi/api.html">HERE</a>. <br><br><br>

API Client
~~~~~~~~~~
`Bruno <https://www.usebruno.com>`_, A `opensource <https://github.com/usebruno/bruno>`_ api client is selected to use for testing APIs. Bruno has desktop clients for Windows, Linux and macOS.
Bruno uses `Bru Markup language <https://docs.usebruno.com/bru-lang/overview>`_ which is very simple and json-like texts. But mostly it is not necessary to add them manually. Here is the guideline how it will be used:

* `Download <https://www.usebruno.com/downloads>`_ and install bruno client on your local machine. Note that there are also portable versions available.
* On your development branch, add proper OpenAPI specs in `<Project Root>/openapi` directory.
* Open `<Project Root>/openapi/bruno` collection in your bruno desktop client.
* Add your endpoint(s) from bruno client. Please use proper environment variables in url, header, body and query param.
* Add proper `scripting <https://docs.usebruno.com/scripting/getting-started>`_ with your request like save resource id to environment variable.
* Use bruno's `secret <https://docs.usebruno.com/secrets-management/overview>`_ for sensitive information like password and tokens.
* Test your endpoint with localstack and/or test server.
* Save request to bruno's collection.
* Now you can see some updated/created files in `<Project Root>/openapi/bruno` directory.
* Git commit them and include them to your PR.
