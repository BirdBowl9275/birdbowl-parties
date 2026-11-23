#!/bin/sh
# Runs every migration plus the RLS/trigger tests against a throwaway local Postgres
# (Postgres.app). Never touches Supabase. The temporary database is deleted at the end.
# Exits non-zero, and prints the log, if any file fails or the final pass line is missing.
# Usage, from the repo root:  sh supabase/tests/run-local.sh
set -e
BIN=/Applications/Postgres.app/Contents/Versions/latest/bin
DIR=$(mktemp -d)
PORT=55432
cd "$(dirname "$0")/.."

"$BIN/initdb" -D "$DIR/data" -U postgres -A trust >/dev/null
"$BIN/pg_ctl" -D "$DIR/data" -o "-p $PORT -k $DIR -c listen_addresses=''" -l "$DIR/log" -w start >/dev/null
cleanup() { "$BIN/pg_ctl" -D "$DIR/data" -m fast stop >/dev/null 2>&1 || true; rm -rf "$DIR"; }
trap cleanup EXIT

PSQL="$BIN/psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$PSQL -c "create database rlstest"
for f in tests/00_auth_stub.sql \
         migrations/0001_init.sql \
         migrations/0002_security_fixes.sql \
         migrations/0003_pending_name_and_sales_edits.sql \
         migrations/0004_add_viewer_role.sql \
         migrations/0005_viewer_read_access.sql \
         migrations/0006_viewer_no_availability_writes.sql \
         tests/rls_tests.sql; do
  echo "== $f"
  if ! $PSQL -d rlstest -f "$f" >"$DIR/out.txt" 2>&1; then
    cat "$DIR/out.txt"
    echo "FAILED in $f"
    exit 1
  fi
  grep -E "FAIL|ERROR|ASSERTIONS PASSED" "$DIR/out.txt" || true
done

if ! grep -q "ASSERTIONS PASSED" "$DIR/out.txt"; then
  cat "$DIR/out.txt"
  echo "FAILED: the final pass line was not printed"
  exit 1
fi
echo "OK"
