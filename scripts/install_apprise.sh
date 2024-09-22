#!/bin/bash

VENV_DIR="/api"

apk update
apk add python3 py3-pip py3-virtualenv

python3 -m venv "$VENV_DIR"

. "$VENV_DIR/bin/activate"

pip install apprise

deactivate

echo "Apprise has been successfully installed in the virtual environment."
