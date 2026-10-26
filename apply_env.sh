#!/usr/bin/env bash

basedir="$(dirname "${BASH_SOURCE[0]}")"

for i in "$@"; do
  file="$basedir/.env.$i"
  if [ "$file" = "$basedir/.env.prod" ]; then
    file="$basedir/.env"
  fi

  printf '%s - ' "$file"
  if [ -f "$file" ]; then
    set -a
    . <(tr -d '\r' < "$file") && printf '✔'
    set +a
  else
    printf "✘"
  fi
  echo
done
