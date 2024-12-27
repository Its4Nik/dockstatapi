#!/bin/bash

echo "Creating unused dependency list"

TMP="$(npx depcheck --ignores https,@typescript-eslint/eslint-plugin,@typescript-eslint/parser,license-checker,uglify-js,@types/supports-color,ipaddr.js,dependency-cruiser,tsx,@types/bcrypt,@types/express,@types/express-handlebars,@types/node,ts-node --quiet --oneline | tail -n 1 | tr -d '\n')"

lines=$(echo -n "$TMP" | tr -s ' ' '\n' | wc -l)

if ((lines == 0)); then
    echo "No unused dependencies."
else
    echo
    echo "Removing these unused dependencies ($lines):"
    for entry in $TMP; do
        echo "$entry"
    done
    echo


    read -n 1 -p "Delete unused dependencies? (y/n) " input
    echo

    case $input in
        Y|y)
            COMMAND=$(echo "npm remove $TMP")
            $COMMAND
            exit 0
            ;;
        *)
            echo "Aborting"
            exit 1
            ;;
        esac
fi

exit 0
