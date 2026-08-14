"""Uses pip-licenses to determine the licenses of all installed packages and generates a report for the docs."""

import json
import subprocess
from pathlib import Path
from tempfile import TemporaryDirectory

import jinja2

if __name__ == "__main__":
    DOCS_PATH = Path("docs")
    PAGES_PATH = DOCS_PATH / "docs"
    JINJA_ENVIRONMENT = jinja2.Environment(
        loader=jinja2.FileSystemLoader(DOCS_PATH / "_templates")
    )

    with TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        licenses_file = tmp_path / "ossLicenses.json"

        subprocess.check_call(
            [
                "pip-licenses",
                "--with-authors",
                "--with-system",
                "--with-urls",
                "--with-description",
                "--with-license-file",
                "--with-notice-file",
                "--format",
                "json",
                "--ignore-packages",
                "vdoc",
                "--output-file",
                licenses_file.as_posix(),
            ]
        )

        licenses: list[dict[str, str | None]] = json.loads(
            licenses_file.read_text(encoding="utf-8")
        )

        # Sphinx pulled the license and notice files in with `literalinclude`, which needed
        # nothing but a path. A markdown page has no such directive, so the text is embedded
        # instead and the paths are dropped. Read leniently: these files come from whatever
        # is installed and are not all UTF-8.
        for license_ in licenses:
            for key, text_key in [
                ("LicenseFile", "LicenseText"),
                ("NoticeFile", "NoticeText"),
            ]:
                file = license_[key]

                if file is not None and file != "UNKNOWN":
                    license_[text_key] = Path(file).read_text(
                        encoding="utf-8", errors="replace"
                    )
                else:
                    license_[text_key] = None

        (PAGES_PATH / "99-license-compliance.md").write_text(
            JINJA_ENVIRONMENT.get_template("license_compliance.md.j2").render(
                licenses=licenses
            ),
            encoding="utf-8",
        )
