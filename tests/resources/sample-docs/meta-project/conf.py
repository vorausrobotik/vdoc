import os

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "Meta Project"
copyright = "2025, John Doe"
author = "John Doe"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "sphinx.ext.intersphinx",
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "alabaster"
rst_prolog = f"""
.. |injected_version| replace:: {os.environ.get("INJECTED_VERSION", "unknown")}
"""

intersphinx_mapping = {
    "project-one": ("http://localhost:8080/project-one/latest", None),
    "project-two": ("http://localhost:8080/project-two/latest", None),
}
