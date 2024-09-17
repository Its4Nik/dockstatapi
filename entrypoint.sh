#!/usr/bin/env bash

SECRET="${SECRET//\"}"

export SECRET

exec npm run start