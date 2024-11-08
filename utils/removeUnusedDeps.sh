#!/bin/bash

TMP="$(npx depcheck --ignores dependency-cruiser --quiet --oneline | tail -n 1)"

echo
echo "Removing these unused dependencies:"
for entry in "$TMP"; do
    echo $entry
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
