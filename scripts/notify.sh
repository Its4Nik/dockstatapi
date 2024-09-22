#!/bin/bash

NOTIFY_TYPE=$1    # ADD, REMOVE, EXIT, ANY
CONTAINER_ID=$2   # Container ID
CONTAINER_NAME=$3 # Container Name
HOST=$4           # Host Name
STATE=$5          # Current State

ADD_MESSAGE="${ADD_MESSAGE:-🆕 Container Added: $CONTAINER_NAME ($CONTAINER_ID) on $HOST}"
REMOVE_MESSAGE="${REMOVE_MESSAGE:-🚫 Container Removed: $CONTAINER_NAME ($CONTAINER_ID) on $HOST}"
EXIT_MESSAGE="${EXIT_MESSAGE:-❌ Container Exited: $CONTAINER_NAME ($CONTAINER_ID) on $HOST}"
ANY_MESSAGE="${ANY_MESSAGE:-⚠️ Container State Changed: $CONTAINER_NAME ($CONTAINER_ID) on $HOST - New State: $STATE}"

case "$NOTIFY_TYPE" in
  ADD)
    MESSAGE="$ADD_MESSAGE"
    ;;
  REMOVE)
    MESSAGE="$REMOVE_MESSAGE"
    ;;
  EXIT)
    MESSAGE="$EXIT_MESSAGE"
    ;;
  ANY)
    MESSAGE="$ANY_MESSAGE"
    ;;
  *)
    MESSAGE="Unknown action for $CONTAINER_NAME ($CONTAINER_ID) on $HOST"
    ;;
esac

if [[ ! -f ./config/apprise_config.yml ]]; then
  echo -n "No Apprise configuration found, aborting."
  exit 1
fi

# Send notification via Apprise

### PYTHON ENVIRONMENT: ###
. /api/bin/activate

apprise -b "$MESSAGE" --config ./config/apprise_config.yml

deactivate
###########################

exit 0
