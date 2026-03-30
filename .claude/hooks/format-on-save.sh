#!/bin/bash
# Claude PostToolUse hook — auto-format .ts files after Write or Edit

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only process .ts files
if [[ "$FILE_PATH" != *.ts ]]; then
  exit 0
fi

# Resolve project root
PROJECT_ROOT=$(git -C "$(dirname "$FILE_PATH")" rev-parse --show-toplevel 2>/dev/null)
if [[ -z "$PROJECT_ROOT" ]]; then
  exit 0
fi

cd "$PROJECT_ROOT" || exit 0

npx prettier --write "$FILE_PATH" --log-level silent 2>/dev/null
npx eslint --fix "$FILE_PATH" --quiet 2>/dev/null

exit 0
