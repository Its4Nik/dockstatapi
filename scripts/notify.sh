#!/bin/bash

NOTIFY_TYPE=$1    # ADD, REMOVE, EXIT, ANY
CONTAINER_ID=$2   # Container ID
CONTAINER_NAME=$3 # Container Name
HOST=$4           # Host Name
STATE=$5          # Current State

case "$NOTIFY_TYPE" in
  ADD)
    MESSAGE="🆕 Container Added: $CONTAINER_NAME ($CONTAINER_ID) on $HOST"
    ;;
  REMOVE)
    MESSAGE="🚫 Container Removed: $CONTAINER_NAME ($CONTAINER_ID) on $HOST"
    ;;
  EXIT)
    MESSAGE="❌ Container Exited: $CONTAINER_NAME ($CONTAINER_ID) on $HOST"
    ;;
  ANY)
    MESSAGE="⚠️ Container State Changed: $CONTAINER_NAME ($CONTAINER_ID) on $HOST - New State: $STATE"
    ;;
  *)
    MESSAGE="ℹ️ Container: $CONTAINER_NAME ($CONTAINER_ID) on $HOST"
    ;;
esac

# Send notification via Apprise
apprise -b "$MESSAGE" --config ./config/apprise_config.yml

exit 0