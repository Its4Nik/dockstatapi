#!/bin/bash
cd src || exit 1
TMP=$(mktemp)

cat ./server.ts | grep "./routes" | awk '{print $2,$4}' > $TMP

spawn_worker(){
    local line="$1"
    local target_route="$(echo "$line" | cut -d '"' -f2).ts"
    local route=$(echo "$line" | awk '{print $1}')

    echo
    echo "Route: $route"
    echo ${target_route}

    sleep 0.5

    npx depcruise \
        -p cli-feedback \
        -T mermaid \
        -x "../node_modules|logger|.dependency-cruiser|path|fs" \
        -f ./misc/dependencyGraphs/mermaid-${route}.txt \
        ${target_route} || exit 1
}

while read line; do
    spawn_worker "$line" &
done < <(cat $TMP)

npx depcruise \
    -p cli-feedback \
    -T mermaid \
    -x "../node_modules|logger|.dependency-cruiser|path|fs" \
    -f ./misc/dependencyGraphs/mermaid-all.txt \
    ./server.ts || exit 1

wait

sleep 0.5

echo -e "\n========\n\n  DONE\n\n========"

exit 0