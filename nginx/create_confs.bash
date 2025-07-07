#!/bin/bash

HOSTNAMES=(
  "home.jacoblounge"
  "cards.jacoblounge"
  "anime.jacoblounge"
  "travel.jacoblounge"
)

TEMPLATE="example_server.conf"
OUTPUT_DIR="sites-enabled"

mkdir -p "$OUTPUT_DIR"

for HOSTNAME in "${HOSTNAMES[@]}"; do
  OUTPUT_FILE="$OUTPUT_DIR/$HOSTNAME.conf"
  sed "s/\\\$\\\$hostname\\\$\\\$/$HOSTNAME/g" "$TEMPLATE" > "$OUTPUT_FILE"
  echo "Generated: $OUTPUT_FILE"
done
