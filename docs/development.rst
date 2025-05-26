Development
###########

..  code-block:: shell

    # Prepare development environment
    npm ci
    python -m venv venv
    source venv/bin/activate
    pip install --upgrade pip tox

    # Build UI
    npm run build

    # Build docs
    tox run -e docs

    # Build python package
    tox run -e build

    # Build local docker image
    docker build -t vdoc:latest .
