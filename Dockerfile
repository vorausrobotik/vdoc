FROM python:3.13-alpine

ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8080
ENTRYPOINT [ "vdoc" ]
CMD ["run"]

RUN --mount=type=bind,source=./dist/,target=/pip-packages/ \
    pip install \
    --no-cache-dir \
    --no-compile \
    --upgrade \
    /pip-packages/*.whl
