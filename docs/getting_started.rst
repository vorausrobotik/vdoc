Getting Started with vdoc
#########################

Run **vdoc** with python
************************

..  code-block:: shell

    pip install vdoc
    vdoc run


Run **vdoc** with docker
************************


..  code-block:: shell

    docker run -p 8080:8080 -v ./vdoc-docs:/srv/vdoc/docs/ voraus.jfrog.io/docker/vdoc:latest
