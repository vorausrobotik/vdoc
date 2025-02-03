import os

from sphinxawesome_theme.postprocess import Icons

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "Test Project 2"
copyright = "2025, John Doe"
author = "John Doe"
release = os.environ.get("INJECTED_VERSION", "unknown")

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = [
    "sphinx.ext.autosectionlabel",
]

templates_path = ["_templates"]
exclude_patterns = ["_build", "Thumbs.db", ".DS_Store"]


# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

html_theme = "sphinxawesome_theme"
html_permalinks_icon = Icons.permalinks_icon
html_show_sphinx = False
rst_prolog = f"""
.. |injected_version| replace:: {os.environ.get("INJECTED_VERSION", "unknown")}
"""
