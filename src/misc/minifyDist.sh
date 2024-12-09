#!/bin/bash

dist="$(pwd)/dist"
TMP="$(mktemp)"

npx tsc

if [ -d $dist ]; then
  echo "::: Dist directory exists."
else
  echo "::: Dist does not exist... Running npx tsc"
  npx tsc
fi

tree -f -n -i $dist | grep ".js" > $TMP

while read -r line; do
    echo "Minifying $line" & \
    npx uglifyjs --no-annotations --in-situ $line & \
done < $TMP

wait

echo -e "\n\n\n\n\n\n\n\n\n"

if [[ $1 = "--build-only" ]]; then
    exit 0
fi

node dist/server.js
