#!/usr/bin/env bash

SECRET="${SECRET//\"}"
CUP_URL="${CUP_URL//\"}"

export SECRET CUP_URL

exec npm run start