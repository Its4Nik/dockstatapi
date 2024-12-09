#!/bin/bash

dist="$(pwd)/dist"

run_script() {
  echo -ne "\r⏳ Minifying : $(basename "$1")"
  npx uglifyjs --no-annotations --in-situ "$1" > /dev/null
  echo -ne "\r✔️  Minified  : $(basename "$1")\n"
}

if [ -d "$dist" ]; then
  echo "::: Dist directory exists."
else
  echo "::: Dist does not exist... Running npx tsc"
  npx tsc
fi

export -f run_script

find "$dist" -type f -exec bash -c 'run_script "$0"' {} \;

echo

if [[ $1 == "--build-only" ]]; then
    exit 0
fi

node dist/server.js
