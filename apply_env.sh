#!/usr/bin/env bash

basedir="$(dirname "$0")"

for i in "$@"; do
  file="$basedir/.env.$i"
  if [ "$file" = "$basedir/.env.prod" ]; then
    file="$basedir/.env"
  fi

  printf "$file - "
  if [ -f "$file" ]; then
    set -a
    . "$file" && printf "✔"
    set +a
  else
    printf "✘"
  fi
  echo
done
