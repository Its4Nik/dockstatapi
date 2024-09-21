#!/bin/bash

CONTAINER_NAME="$1"
CONTAINER_PREVIOS_STATE="$2"
CONTAINER_STATE="$3"

ALL_NOTIFICATIONS="$ALL_NOTIFICATIONS"

if [[ -z $ALL_NOTIFICATIONS ]]; then
    echo -n "No notification service set"
else
    apprise -vv -t 'DockStat' -b "$CONTAINER_NAME changed from '$CONTAINER_PREVIOS_STATE', to '$CONTAINER_STATE'" \
        $ALL_NOTIFICATIONS
fi