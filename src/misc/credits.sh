#!/bin/bash

if ! command -v jq 2>&1 >/dev/null
then
    echo "ERROR: jq could not be found"
    exit 1
fi


LICENSE_JSON=$(npx license-checker \
  --exclude 'MIT, MIT-0, MIT OR X11, BSD, ISC, Unlicense, CC0-1.0, Python-2.0: 1' \
  --json)
{
    echo -e "# CREDITS\n"
    echo "This file shows all npm packages used in DockStatAPI (also Dev packages)"
}

jq -r '
  to_entries |
  group_by(.value.licenses)[] |
  "### License: \(.[0].value.licenses)\n\n" +
  "| Name | Repository | Publisher |\n|------|-------------|-----------|\n" +
  (map(
    "| \(.key) | \(.value.repository // "N/A") | \(.value.publisher // "N/A") |"
  ) | join("\n")) + "\n\n"
' <<< "$LICENSE_JSON" >> CREDITS.md

echo "Markdown file with license information has been created: CREDITS.md"
