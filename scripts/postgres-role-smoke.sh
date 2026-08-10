#!/usr/bin/env bash
set -euo pipefail

: "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}"
: "${DB_MIGRATOR_PASSWORD:?Set DB_MIGRATOR_PASSWORD}"
: "${DB_RUNTIME_PASSWORD:?Set DB_RUNTIME_PASSWORD}"
: "${POSTGRES_USER:=compify}"
: "${POSTGRES_DB:=compify}"
export POSTGRES_USER POSTGRES_DB

if [[ ${#POSTGRES_PASSWORD} -lt 24 || ${#DB_MIGRATOR_PASSWORD} -lt 24 || ${#DB_RUNTIME_PASSWORD} -lt 24 ]]; then
  echo "PostgreSQL smoke-test passwords must each contain at least 24 characters" >&2
  exit 1
fi
if [[ $POSTGRES_PASSWORD == "$DB_MIGRATOR_PASSWORD" ||
      $POSTGRES_PASSWORD == "$DB_RUNTIME_PASSWORD" ||
      $DB_MIGRATOR_PASSWORD == "$DB_RUNTIME_PASSWORD" ]]; then
  echo "PostgreSQL smoke-test passwords must be distinct" >&2
  exit 1
fi

compose=(docker compose)
if [[ -n ${COMPOSE_ENV_FILE:-} ]]; then
  compose+=(--env-file "$COMPOSE_ENV_FILE")
fi

bootstrap_sql() {
  "${compose[@]}" exec -T -e PGPASSWORD="$POSTGRES_PASSWORD" postgres \
    psql -X -v ON_ERROR_STOP=1 --host=127.0.0.1 --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB" "$@"
}

migrator_sql_with() {
  local password=$1
  shift
  "${compose[@]}" exec -T -e PGPASSWORD="$password" postgres \
    psql -X -v ON_ERROR_STOP=1 --host=127.0.0.1 --username=compify_migrator \
    --dbname="$POSTGRES_DB" "$@"
}

run_bootstrap_with() {
  local migrator_password=$1
  local runtime_password=$2
  "${compose[@]}" run --rm --no-deps \
    -e DB_MIGRATOR_PASSWORD="$migrator_password" \
    -e DB_RUNTIME_PASSWORD="$runtime_password" \
    postgres-role-bootstrap
}

run_grants_with() {
  local migrator_password=$1
  "${compose[@]}" run --rm --no-deps \
    -e DB_MIGRATOR_PASSWORD="$migrator_password" \
    postgres-role-grants
}

run_check_with() {
  local runtime_password=$1
  "${compose[@]}" run --rm --no-deps \
    -e DB_RUNTIME_PASSWORD="$runtime_password" \
    postgres-role-check
}

expect_check_failure() {
  local runtime_password=$1
  local label=$2
  if run_check_with "$runtime_password" >/dev/null 2>&1; then
    echo "Role verification unexpectedly accepted: $label" >&2
    exit 1
  fi
}

expect_bootstrap_failure() {
  local label=$1
  if run_bootstrap_with "$DB_MIGRATOR_PASSWORD" "$DB_RUNTIME_PASSWORD" >/dev/null 2>&1; then
    echo "Role bootstrap unexpectedly accepted: $label" >&2
    exit 1
  fi
}

expect_password_failure() {
  local username=$1
  local password=$2
  local label=$3
  if "${compose[@]}" run --rm --no-deps --entrypoint psql \
      -e PGPASSWORD="$password" postgres \
      -X --host=postgres --username="$username" --dbname="$POSTGRES_DB" \
      -Atqc 'SELECT 1' >/dev/null 2>&1; then
    echo "Old PostgreSQL credential unexpectedly remained valid: $label" >&2
    exit 1
  fi
}

echo "Starting an empty PostgreSQL service for legacy-volume conversion coverage"
"${compose[@]}" up -d --wait postgres
existing_relations=$(bootstrap_sql -Atqc \
  "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m','f')")
if [[ $existing_relations != 0 ]]; then
  echo "Refusing to run the conversion smoke test against a non-empty public schema" >&2
  exit 1
fi

"${compose[@]}" build api-migrate api
"${compose[@]}" run --rm --no-deps \
  -e DB_USERNAME="$POSTGRES_USER" \
  -e DB_PASSWORD="$POSTGRES_PASSWORD" \
  -e PGOPTIONS= \
  api-migrate sh -ec \
  'bun ./node_modules/typeorm/cli.js migration:run -d dist/data-source.js'

marker_email=postgres-role-conversion@compify.invalid
bootstrap_sql -v marker_email="$marker_email" <<'SQL'
INSERT INTO public.newsletter (email)
VALUES (:'marker_email')
ON CONFLICT (email) DO NOTHING;
SQL
before_migrations=$(bootstrap_sql -Atqc \
  "SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.id)::text,'[]') FROM public.migrations m")

# Convert an existing legacy-owned schema, then prove a second pass is idempotent.
run_bootstrap_with "$DB_MIGRATOR_PASSWORD" "$DB_RUNTIME_PASSWORD"
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"
if run_bootstrap_with "$DB_RUNTIME_PASSWORD" "$DB_RUNTIME_PASSWORD" >/dev/null 2>&1; then
  echo "Role bootstrap accepted identical migrator and runtime passwords" >&2
  exit 1
fi

marker_count=$(bootstrap_sql -Atqc \
  "SELECT count(*) FROM public.newsletter WHERE email='$marker_email'")
[[ $marker_count == 1 ]] || {
  echo "Legacy-volume marker row was not preserved during role conversion" >&2
  exit 1
}
bootstrap_sql -Atqc "
DO \$ownership\$
DECLARE unexpected text;
BEGIN
  SELECT string_agg(format('%s owned by %s',c.relname,pg_get_userbyid(c.relowner)),', ')
    INTO unexpected
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m','f')
    AND pg_get_userbyid(c.relowner)<>'compify_owner';
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'converted relations have unexpected owners: %', unexpected;
  END IF;
  SELECT string_agg(format('%s owned by %s',t.typname,pg_get_userbyid(t.typowner)),', ')
    INTO unexpected
  FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
  WHERE n.nspname='public' AND t.typtype IN ('e','d')
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d
      WHERE d.classid='pg_type'::regclass AND d.objid=t.oid AND d.deptype='e'
    )
    AND pg_get_userbyid(t.typowner)<>'compify_owner';
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'converted enum/domain types have unexpected owners: %', unexpected;
  END IF;
END
\$ownership\$;" >/dev/null

run_bootstrap_with "$DB_MIGRATOR_PASSWORD" "$DB_RUNTIME_PASSWORD"
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"
after_migrations=$(bootstrap_sql -Atqc \
  "SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.id)::text,'[]') FROM public.migrations m")
[[ $before_migrations == "$after_migrations" ]] || {
  echo "Migration ledger changed during an idempotent role-policy replay" >&2
  exit 1
}

# Prove the verifier requires every CRUD privilege and rejects all non-allowlisted ACLs.
migrator_sql_with "$DB_MIGRATOR_PASSWORD" -qc \
  'REVOKE INSERT ON TABLE public.newsletter FROM compify_runtime'
expect_check_failure "$DB_RUNTIME_PASSWORD" 'runtime missing INSERT while retaining SELECT'
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"

migrator_sql_with "$DB_MIGRATOR_PASSWORD" -qc \
  'GRANT UPDATE ON TABLE public.migrations TO compify_runtime'
expect_check_failure "$DB_RUNTIME_PASSWORD" 'runtime UPDATE on migration evidence'
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"

migrator_sql_with "$DB_MIGRATOR_PASSWORD" -qc \
  'GRANT SELECT ON TABLE public.component TO PUBLIC'
expect_check_failure "$DB_RUNTIME_PASSWORD" 'PUBLIC SELECT on an application table'
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"

# Unexpected role membership, object ACL grantees, and default ACLs must be
# detected by verification and removed by a complete policy replay.
bootstrap_sql -qc \
  "CREATE ROLE compify_acl_attacker LOGIN PASSWORD 'compify-ci-attacker-only-000000000000'; GRANT compify_owner TO compify_acl_attacker"
expect_check_failure "$DB_RUNTIME_PASSWORD" 'unexpected member of compify_owner'
run_bootstrap_with "$DB_MIGRATOR_PASSWORD" "$DB_RUNTIME_PASSWORD"
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"

bootstrap_sql -qc \
  'DO $$ BEGIN EXECUTE format('"'"'GRANT CONNECT ON DATABASE %I TO compify_acl_attacker'"'"', current_database()); END $$; GRANT USAGE ON SCHEMA public TO compify_acl_attacker; GRANT SELECT ON TABLE public.component TO compify_acl_attacker; GRANT SELECT(email) ON TABLE public.newsletter TO compify_acl_attacker; GRANT USAGE ON TYPE public.component_language_enum TO compify_acl_attacker'
expect_check_failure "$DB_RUNTIME_PASSWORD" 'unexpected explicit database, schema, table, column, and type ACL grantee'
run_bootstrap_with "$DB_MIGRATOR_PASSWORD" "$DB_RUNTIME_PASSWORD"
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"

migrator_sql_with "$DB_MIGRATOR_PASSWORD" -qc \
  'ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner IN SCHEMA public GRANT SELECT ON TABLES TO PUBLIC'
expect_check_failure "$DB_RUNTIME_PASSWORD" 'schema-specific PUBLIC default table grant'
run_bootstrap_with "$DB_MIGRATOR_PASSWORD" "$DB_RUNTIME_PASSWORD"
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"
bootstrap_sql -qc 'DROP ROLE compify_acl_attacker'

# Fail closed for schema drift and executable code that was not versioned in policy.
migrator_sql_with "$DB_MIGRATOR_PASSWORD" -qc \
  'CREATE TABLE public.compify_unclassified_probe(id integer)'
expect_bootstrap_failure 'an unclassified public relation'
migrator_sql_with "$DB_MIGRATOR_PASSWORD" -qc \
  'DROP TABLE public.compify_unclassified_probe'

migrator_sql_with "$DB_MIGRATOR_PASSWORD" -qc \
  'CREATE FUNCTION public.compify_unclassified_probe() RETURNS integer LANGUAGE sql AS $$ SELECT 1 $$'
expect_bootstrap_failure 'an unclassified public function'
migrator_sql_with "$DB_MIGRATOR_PASSWORD" -qc \
  'DROP FUNCTION public.compify_unclassified_probe()'
run_bootstrap_with "$DB_MIGRATOR_PASSWORD" "$DB_RUNTIME_PASSWORD"
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"

# Rotate both application-role passwords, prove old credentials fail, then restore
# the configured values so the remainder of the self-host E2E can start normally.
rotated_migrator_password=${ROTATED_DB_MIGRATOR_PASSWORD:-compify-ci-rotated-migrator-only-00000000}
rotated_runtime_password=${ROTATED_DB_RUNTIME_PASSWORD:-compify-ci-rotated-runtime-only-0000000000}
if [[ $rotated_migrator_password == "$DB_MIGRATOR_PASSWORD" ||
      $rotated_runtime_password == "$DB_RUNTIME_PASSWORD" ||
      $rotated_migrator_password == "$rotated_runtime_password" ]]; then
  echo "Rotated PostgreSQL smoke-test credentials must be distinct from configured credentials" >&2
  exit 1
fi
run_bootstrap_with "$rotated_migrator_password" "$rotated_runtime_password"
expect_password_failure compify_migrator "$DB_MIGRATOR_PASSWORD" compify_migrator
expect_password_failure compify_runtime "$DB_RUNTIME_PASSWORD" compify_runtime
run_grants_with "$rotated_migrator_password"
run_check_with "$rotated_runtime_password"

run_bootstrap_with "$DB_MIGRATOR_PASSWORD" "$DB_RUNTIME_PASSWORD"
expect_password_failure compify_migrator "$rotated_migrator_password" 'rotated compify_migrator'
expect_password_failure compify_runtime "$rotated_runtime_password" 'rotated compify_runtime'
run_grants_with "$DB_MIGRATOR_PASSWORD"
run_check_with "$DB_RUNTIME_PASSWORD"

echo "PostgreSQL legacy conversion, ACL denial, idempotence, and password rotation checks passed"
