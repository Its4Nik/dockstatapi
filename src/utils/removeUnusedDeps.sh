#!/bin/bash

TMP="$(npx depcheck --ignores @types/supports-color,ipaddr.js,dependency-cruiser,tsx,@types/bcrypt,@types/express,@types/express-handlebars,@types/node,ts-node --quiet --oneline | tail -n 1 | tr -d '\n')"

lines=$(echo "$TMP" | tr -s ' ' '\n' | wc -l)

if ((lines == 0)); then
    echo "No unused dependencies."
else
    echo
    echo "Removing these unused dependencies:"
    for entry in $TMP; do
        echo "$entry"
    done
    echo
fi


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

exit 2
