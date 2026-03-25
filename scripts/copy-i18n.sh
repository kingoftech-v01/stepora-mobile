#!/bin/bash
# Copy i18n translation files from the web app to the mobile app.
# Run from the stepora-mobile directory: bash scripts/copy-i18n.sh

SOURCE_DIR="/root/stepora-frontend/src/i18n"
TARGET_DIR="/root/stepora-mobile/src/i18n"

mkdir -p "$TARGET_DIR"

for lang in en fr es de pt it nl ru ja ko zh ar hi tr pl ht; do
  if [ -f "$SOURCE_DIR/$lang.json" ]; then
    cp "$SOURCE_DIR/$lang.json" "$TARGET_DIR/$lang.json"
    echo "Copied $lang.json"
  else
    echo "Warning: $SOURCE_DIR/$lang.json not found"
  fi
done

echo "Done. All i18n files copied."
