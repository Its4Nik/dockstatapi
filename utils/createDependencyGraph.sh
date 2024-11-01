#!/bin/bash

TMP=$(mktemp)

cat ./server.js | grep "./routes" | awk '{print $2,$4}' > $TMP

while read line; do
    target_route=$(echo "$line" | cut -d '"' -f2)
    route=$(echo "$line" | awk '{print $1}')

    echo
    echo "Route: $route"
    echo ${target_route}.js


    npx depcruise \
        -p cli-feedback \
        -T mermaid \
        -x "^node_modules|logger|.dependency-cruiser|path|fs" \
        -f ./misc/dependencyGraphs/mermaid-${route}.txt \
        ${target_route}.js

done < <(cat $TMP)

npx depcruise \
    -p cli-feedback \
    -T mermaid \
    -x "^node_modules|logger|.dependency-cruiser|path|fs" \
    -f ./misc/dependencyGraphs/mermaid-all.txt \
    ./

sleep 0.5

echo -e "\n========\n\n  DONE\n\n========"
