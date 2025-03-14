# Configuration file for the Sphinx documentation builder.
#
# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "BloodConnect"
# copyright = ""
# author = ""

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "sphinx.ext.graphviz",
    "sphinxcontrib.redoc"
]
graphviz_output_format = "svg"

templates_path = ["templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "sphinx_rtd_theme"
html_title = "BloodConnect"
html_static_path = ["static"]
html_css_files = [
    "css/custom.css"
]
html_logo = "static/images/BloodConnect-icon.png"
html_favicon = "static/images/favicon.ico"

redoc_uri = "https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"
redoc = [{
    "name": "BloodConnect API",
    "page": "openapi/api",
    "spec": f"openapi/v1.json"
}]
