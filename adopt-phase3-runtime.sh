#!/bin/sh
set -eu

backup_file() {
  src="$1"
  if [ -f "$src" ]; then
    cp "$src" "$src.phase3-backup"
  fi
}

apply_copy() {
  src="$1"
  dest="$2"
  if [ ! -f "$src" ]; then
    echo "[phase3] Missing source file: $src" >&2
    exit 1
  fi
  backup_file "$dest"
  cp "$src" "$dest"
  echo "[phase3] Applied $src -> $dest"
}

apply_copy "server.phase3.ts" "server.ts"
apply_copy "app/auth/register-v2/page.tsx" "app/auth/register/page.tsx"
apply_copy "app/chat-v2/page.tsx" "app/chat/page.tsx"
apply_copy "prisma/schema.phase3.prisma" "prisma/schema.prisma"

echo "[phase3] Phase 3 runtime files have been copied into primary paths."
echo "[phase3] Next steps: run Prisma migration, regenerate client, and verify chat/register flows."
