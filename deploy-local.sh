#!/usr/bin/env bash
set -euo pipefail

# Run the shared hosting deploy-local script from the cc-financial project.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOSTING_DIR="${SCRIPT_DIR}/../hosting"

if [[ ! -x "${HOSTING_DIR}/deploy-local.sh" ]]; then
  echo "Expected executable ${HOSTING_DIR}/deploy-local.sh not found." >&2
  exit 1
fi

exec "${HOSTING_DIR}/deploy-local.sh" "$@"
