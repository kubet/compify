#!/bin/sh
set -eu

phase=${POSTGRES_ROLE_PHASE:?Set POSTGRES_ROLE_PHASE to bootstrap, grants, or verify}
: "${POSTGRES_DB:?Set POSTGRES_DB}"

require_long_secret() {
  secret_name=$1
  secret_value=$2
  if [ "${#secret_value}" -lt 24 ]; then
    echo "$secret_name must contain at least 24 characters" >&2
    exit 1
  fi
}

migrator_psql() {
  PGPASSWORD=$DB_MIGRATOR_PASSWORD psql -X -v ON_ERROR_STOP=1 \
    --host=postgres --username=compify_migrator --dbname="$POSTGRES_DB"
}
runtime_psql() {
  PGPASSWORD=$DB_RUNTIME_PASSWORD psql -X -v ON_ERROR_STOP=1 \
    --host=postgres --username=compify_runtime --dbname="$POSTGRES_DB" \
    --set=legacy_owner="${LEGACY_DATABASE_OWNER:-}" "$@"
}

case "$phase" in
  bootstrap)
    : "${POSTGRES_USER:?Set POSTGRES_USER}"
    : "${POSTGRES_PASSWORD:?Set POSTGRES_PASSWORD}"
    : "${LEGACY_DATABASE_OWNER:?Set LEGACY_DATABASE_OWNER to the existing dedicated database owner}"
    : "${DB_MIGRATOR_PASSWORD:?Set DB_MIGRATOR_PASSWORD}"
    : "${DB_RUNTIME_PASSWORD:?Set DB_RUNTIME_PASSWORD}"
    require_long_secret DB_MIGRATOR_PASSWORD "$DB_MIGRATOR_PASSWORD"
    require_long_secret DB_RUNTIME_PASSWORD "$DB_RUNTIME_PASSWORD"
    case "$POSTGRES_USER" in
      compify_owner|compify_migrator|compify_runtime)
        echo "POSTGRES_USER must remain a distinct bootstrap/break-glass role" >&2
        exit 1
        ;;
    esac
    case "$LEGACY_DATABASE_OWNER" in
      ''|*[!a-zA-Z0-9_]*|[0-9]*)
        echo "LEGACY_DATABASE_OWNER must be one unquoted PostgreSQL role identifier" >&2
        exit 1
        ;;
    esac
    if [ "${#POSTGRES_PASSWORD}" -lt 24 ]; then
      echo "POSTGRES_PASSWORD must contain at least 24 characters" >&2
      exit 1
    fi
    if [ "$POSTGRES_PASSWORD" = "$DB_MIGRATOR_PASSWORD" ] || \
       [ "$POSTGRES_PASSWORD" = "$DB_RUNTIME_PASSWORD" ] || \
       [ "$DB_MIGRATOR_PASSWORD" = "$DB_RUNTIME_PASSWORD" ]; then
      echo "PostgreSQL bootstrap, migrator, and runtime passwords must be distinct" >&2
      exit 1
    fi

    PGPASSWORD=$POSTGRES_PASSWORD psql -X -v ON_ERROR_STOP=1 \
      --host=postgres --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" \
      --set=database_name="$POSTGRES_DB" \
      --set=legacy_owner="$LEGACY_DATABASE_OWNER" \
      --set=migrator_password="$DB_MIGRATOR_PASSWORD" \
      --set=runtime_password="$DB_RUNTIME_PASSWORD" <<'SQL'
SELECT 'CREATE ROLE compify_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'compify_owner') \gexec
SELECT 'CREATE ROLE compify_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'compify_migrator') \gexec
SELECT 'CREATE ROLE compify_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'compify_runtime') \gexec

ALTER ROLE compify_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT;
ALTER ROLE compify_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT PASSWORD :'migrator_password';
ALTER ROLE compify_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS NOINHERIT PASSWORD :'runtime_password';

DO $memberships$
DECLARE membership record;
BEGIN
  -- Protected roles form a closed membership graph. Remove both roles granted
  -- to them and unexpected members granted access to them before restoring the
  -- one intended owner -> migrator SET-only edge below.
  FOR membership IN
    SELECT parent.rolname AS parent_name, child.rolname AS child_name
    FROM pg_auth_members member
    JOIN pg_roles parent ON parent.oid = member.roleid
    JOIN pg_roles child ON child.oid = member.member
    WHERE child.rolname IN ('compify_owner', 'compify_migrator', 'compify_runtime')
       OR parent.rolname IN ('compify_owner', 'compify_migrator', 'compify_runtime')
  LOOP
    EXECUTE format('REVOKE %I FROM %I', membership.parent_name, membership.child_name);
  END LOOP;
END
$memberships$;

GRANT compify_owner TO compify_migrator WITH ADMIN FALSE, INHERIT FALSE, SET TRUE;
ALTER ROLE compify_migrator SET role TO 'compify_owner';
ALTER ROLE compify_runtime RESET role;

SELECT set_config('compify.legacy_owner', :'legacy_owner', false);
DO $inventory$
DECLARE unexpected text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=current_setting('compify.legacy_owner')) THEN
    RAISE EXCEPTION 'LEGACY_DATABASE_OWNER role % does not exist', current_setting('compify.legacy_owner');
  END IF;

  SELECT string_agg(format('%s:%s', c.relkind, c.relname), ', ' ORDER BY c.relname)
    INTO unexpected
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m','f')
    AND c.relname <> ALL (ARRAY[
      'cli_token','component','component_revision','external_component','migrations',
      'newsletter','report','subscription','subscription_plan','themes',
      'themes_quarantine_1786121078244','token','upvote','user','user_used_components',
      'migrations_id_seq','themes_quarantine_1786121078244_quarantine_id_seq'
    ]);
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'dedicated public schema contains unclassified relations: %', unexpected;
  END IF;

  SELECT string_agg(t.typname, ', ' ORDER BY t.typname) INTO unexpected
  FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
  WHERE n.nspname='public' AND t.typtype IN ('e','d')
    AND t.typname <> ALL (ARRAY[
      'component_language_enum','component_visibility_enum',
      'subscription_plan_billingcycle_enum','subscription_status_enum',
      'token_type_enum','upvote_status_enum'
    ])
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d
      WHERE d.classid='pg_type'::regclass AND d.objid=t.oid AND d.deptype='e'
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'dedicated public schema contains unclassified enum/domain types: %', unexpected;
  END IF;

  SELECT string_agg(
      format('%s(%s)%s', p.proname, pg_get_function_identity_arguments(p.oid),
        CASE WHEN p.prosecdef THEN ' SECURITY DEFINER' ELSE '' END),
      ', ' ORDER BY p.proname, pg_get_function_identity_arguments(p.oid))
    INTO unexpected
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (
      p.prosecdef OR NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        JOIN pg_extension e ON e.oid=d.refobjid
        WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e'
          AND e.extname = ANY (ARRAY['uuid-ossp','pg_trgm','btree_gin'])
      )
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'public schema contains unclassified or SECURITY DEFINER functions: %', unexpected;
  END IF;

  SELECT string_agg(format('%s owned by %s', c.relname, pg_get_userbyid(c.relowner)), ', ')
    INTO unexpected
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m','f')
    AND pg_get_userbyid(c.relowner) NOT IN (current_setting('compify.legacy_owner'),'compify_owner');
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'classified public relations have an unexpected owner: %', unexpected;
  END IF;

  SELECT string_agg(format('%s owned by %s', t.typname, pg_get_userbyid(t.typowner)), ', ')
    INTO unexpected
  FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
  WHERE n.nspname='public' AND t.typtype IN ('e','d')
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d
      WHERE d.classid='pg_type'::regclass AND d.objid=t.oid AND d.deptype='e'
    )
    AND pg_get_userbyid(t.typowner) NOT IN
      (current_setting('compify.legacy_owner'),'compify_owner');
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'classified public enum/domain types have an unexpected owner: %', unexpected;
  END IF;
END
$inventory$;

SELECT format(
  CASE c.relkind
    WHEN 'S' THEN 'ALTER SEQUENCE %I.%I OWNER TO compify_owner'
    WHEN 'v' THEN 'ALTER VIEW %I.%I OWNER TO compify_owner'
    WHEN 'm' THEN 'ALTER MATERIALIZED VIEW %I.%I OWNER TO compify_owner'
    WHEN 'f' THEN 'ALTER FOREIGN TABLE %I.%I OWNER TO compify_owner'
    ELSE 'ALTER TABLE %I.%I OWNER TO compify_owner'
  END,
  n.nspname, c.relname)
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m','f')
  AND pg_get_userbyid(c.relowner)=:'legacy_owner'
ORDER BY CASE WHEN c.relkind='S' THEN 1 ELSE 0 END, c.relkind, c.relname \gexec

SELECT format(
  CASE t.typtype WHEN 'd' THEN 'ALTER DOMAIN %I.%I OWNER TO compify_owner'
                 ELSE 'ALTER TYPE %I.%I OWNER TO compify_owner' END,
  n.nspname, t.typname)
FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
WHERE n.nspname='public' AND t.typtype IN ('e','d')
  AND pg_get_userbyid(t.typowner)=:'legacy_owner'
  AND NOT EXISTS (
    SELECT 1 FROM pg_depend d
    WHERE d.classid='pg_type'::regclass AND d.objid=t.oid AND d.deptype='e'
  )
ORDER BY t.typname \gexec

ALTER DATABASE :"database_name" OWNER TO compify_owner;
REVOKE ALL PRIVILEGES ON DATABASE :"database_name" FROM PUBLIC, :"legacy_owner", compify_migrator, compify_runtime;
SELECT DISTINCT format('REVOKE ALL PRIVILEGES ON DATABASE %I FROM %I', d.datname, grantee.rolname)
FROM pg_database d
CROSS JOIN LATERAL aclexplode(COALESCE(d.datacl, acldefault('d', d.datdba))) privilege
JOIN pg_roles grantee ON grantee.oid=privilege.grantee
WHERE d.datname=:'database_name' AND privilege.grantee<>d.datdba
ORDER BY 1 \gexec
GRANT CONNECT ON DATABASE :"database_name" TO :"legacy_owner", compify_migrator, compify_runtime;

ALTER SCHEMA public OWNER TO compify_owner;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM PUBLIC, :"legacy_owner", compify_migrator, compify_runtime;
SELECT DISTINCT format('REVOKE ALL PRIVILEGES ON SCHEMA %I FROM %I', n.nspname, grantee.rolname)
FROM pg_namespace n
CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl, acldefault('n', n.nspowner))) privilege
JOIN pg_roles grantee ON grantee.oid=privilege.grantee
WHERE n.nspname='public' AND privilege.grantee<>n.nspowner
ORDER BY 1 \gexec
GRANT USAGE ON SCHEMA public TO compify_migrator, compify_runtime;

-- Remove every customized grant from compify_owner's existing default ACLs,
-- including global entries, before migrations create any new objects.
DO $defaults$
DECLARE default_grant record;
BEGIN
  FOR default_grant IN
    SELECT DISTINCT
      COALESCE(namespace.nspname, '') AS schema_name,
      defaults.defaclobjtype AS object_type,
      CASE WHEN privilege.grantee=0 THEN 'PUBLIC' ELSE format('%I', grantee.rolname) END AS grantee_sql
    FROM pg_default_acl defaults
    JOIN pg_roles owner_role ON owner_role.oid=defaults.defaclrole
    LEFT JOIN pg_namespace namespace ON namespace.oid=defaults.defaclnamespace
    CROSS JOIN LATERAL aclexplode(defaults.defaclacl) privilege
    LEFT JOIN pg_roles grantee ON grantee.oid=privilege.grantee
    WHERE owner_role.rolname='compify_owner' AND privilege.grantee<>defaults.defaclrole
  LOOP
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner %s REVOKE ALL ON %s FROM %s',
      CASE WHEN default_grant.schema_name='' THEN '' ELSE format('IN SCHEMA %I', default_grant.schema_name) END,
      CASE default_grant.object_type
        WHEN 'r' THEN 'TABLES' WHEN 'S' THEN 'SEQUENCES'
        WHEN 'f' THEN 'FUNCTIONS' WHEN 'T' THEN 'TYPES' WHEN 'n' THEN 'SCHEMAS'
      END,
      default_grant.grantee_sql
    );
  END LOOP;
END
$defaults$;
ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner REVOKE USAGE ON TYPES FROM PUBLIC;
SQL
    ;;

  grants)
    : "${DB_MIGRATOR_PASSWORD:?Set DB_MIGRATOR_PASSWORD}"
    require_long_secret DB_MIGRATOR_PASSWORD "$DB_MIGRATOR_PASSWORD"
    migrator_psql <<'SQL'
DO $required$
DECLARE
  table_name text;
  unexpected text;
BEGIN
  IF session_user <> 'compify_migrator' OR current_user <> 'compify_owner' THEN
    RAISE EXCEPTION 'migrator identity mismatch: session=%, current=%', session_user, current_user;
  END IF;
  FOREACH table_name IN ARRAY ARRAY[
    'cli_token','component','component_revision','external_component','migrations',
    'newsletter','report','subscription','subscription_plan','themes',
    'themes_quarantine_1786121078244','token','upvote','user','user_used_components'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NULL THEN
      RAISE EXCEPTION 'required table public.% is missing', table_name;
    END IF;
    IF (SELECT tableowner FROM pg_tables WHERE schemaname='public' AND tablename=table_name)
       <> 'compify_owner' THEN
      RAISE EXCEPTION 'table public.% is not owned by compify_owner', table_name;
    END IF;
  END LOOP;

  SELECT string_agg(format('%s:%s owned by %s', c.relkind, c.relname,
      pg_get_userbyid(c.relowner)), ', ' ORDER BY c.relname)
    INTO unexpected
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m','f')
    AND (
      c.relname <> ALL (ARRAY[
        'cli_token','component','component_revision','external_component','migrations',
        'newsletter','report','subscription','subscription_plan','themes',
        'themes_quarantine_1786121078244','token','upvote','user','user_used_components',
        'migrations_id_seq','themes_quarantine_1786121078244_quarantine_id_seq'
      ]) OR pg_get_userbyid(c.relowner) <> 'compify_owner'
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'post-migration relation inventory is not allowlisted/owner-controlled: %', unexpected;
  END IF;

  SELECT string_agg(format('%s owned by %s', t.typname, pg_get_userbyid(t.typowner)),
      ', ' ORDER BY t.typname)
    INTO unexpected
  FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
  WHERE n.nspname='public' AND t.typtype IN ('e','d')
    AND NOT EXISTS (
      SELECT 1 FROM pg_depend d
      WHERE d.classid='pg_type'::regclass AND d.objid=t.oid AND d.deptype='e'
    )
    AND (
      t.typname <> ALL (ARRAY[
        'component_language_enum','component_visibility_enum',
        'subscription_plan_billingcycle_enum','subscription_status_enum',
        'token_type_enum','upvote_status_enum'
      ]) OR pg_get_userbyid(t.typowner) <> 'compify_owner'
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'post-migration enum/domain inventory is not allowlisted/owner-controlled: %', unexpected;
  END IF;

  SELECT string_agg(
      format('%s(%s)%s', p.proname, pg_get_function_identity_arguments(p.oid),
        CASE WHEN p.prosecdef THEN ' SECURITY DEFINER' ELSE '' END),
      ', ' ORDER BY p.proname, pg_get_function_identity_arguments(p.oid))
    INTO unexpected
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (
      p.prosecdef OR NOT EXISTS (
        SELECT 1
        FROM pg_depend d
        JOIN pg_extension e ON e.oid=d.refobjid
        WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e'
          AND e.extname = ANY (ARRAY['uuid-ossp','pg_trgm','btree_gin'])
      )
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'post-migration public functions are unclassified or SECURITY DEFINER: %', unexpected;
  END IF;
END
$required$;

REVOKE ALL PRIVILEGES ON SCHEMA public FROM PUBLIC, compify_migrator, compify_runtime;
SELECT DISTINCT format('REVOKE ALL PRIVILEGES ON SCHEMA %I FROM %I', n.nspname, grantee.rolname)
FROM pg_namespace n
CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl, acldefault('n', n.nspowner))) acl_entry
JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
WHERE n.nspname='public' AND acl_entry.grantee<>n.nspowner
ORDER BY 1 \gexec
GRANT USAGE ON SCHEMA public TO compify_migrator, compify_runtime;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, compify_migrator, compify_runtime;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, compify_migrator, compify_runtime;
SELECT DISTINCT format(
  'REVOKE ALL PRIVILEGES ON %s %I.%I FROM %I',
  CASE WHEN c.relkind='S' THEN 'SEQUENCE' ELSE 'TABLE' END,
  n.nspname, c.relname, grantee.rolname)
FROM pg_class c
JOIN pg_namespace n ON n.oid=c.relnamespace
CROSS JOIN LATERAL aclexplode(COALESCE(
  c.relacl,
  acldefault(CASE WHEN c.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END, c.relowner)
)) acl_entry
JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
WHERE n.nspname='public' AND c.relkind IN ('r','p','S','v','m','f')
  AND acl_entry.grantee<>c.relowner
ORDER BY 1 \gexec
SELECT DISTINCT format(
  'REVOKE ALL PRIVILEGES (%I) ON TABLE %I.%I FROM %s',
  attribute.attname, namespace.nspname, relation.relname,
  CASE WHEN acl_entry.grantee=0 THEN 'PUBLIC' ELSE format('%I', grantee.rolname) END)
FROM pg_attribute attribute
JOIN pg_class relation ON relation.oid=attribute.attrelid
JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
CROSS JOIN LATERAL aclexplode(attribute.attacl) acl_entry
LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
WHERE namespace.nspname='public' AND relation.relkind IN ('r','p','v','m','f')
  AND NOT attribute.attisdropped
ORDER BY 1 \gexec
SELECT DISTINCT format(
  'REVOKE ALL PRIVILEGES ON TYPE %I.%I FROM %s',
  namespace.nspname, type_entry.typname,
  CASE WHEN acl_entry.grantee=0 THEN 'PUBLIC' ELSE format('%I', grantee.rolname) END)
FROM pg_type type_entry
JOIN pg_namespace namespace ON namespace.oid=type_entry.typnamespace
CROSS JOIN LATERAL aclexplode(COALESCE(type_entry.typacl, acldefault('T', type_entry.typowner))) acl_entry
LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
WHERE namespace.nspname='public' AND type_entry.typtype IN ('e','d')
  AND acl_entry.grantee<>type_entry.typowner
ORDER BY 1 \gexec
GRANT USAGE ON TYPE
  public.component_language_enum, public.component_visibility_enum,
  public.subscription_plan_billingcycle_enum, public.subscription_status_enum,
  public.token_type_enum, public.upvote_status_enum
TO compify_runtime;

DO $defaults$
DECLARE default_grant record;
BEGIN
  FOR default_grant IN
    SELECT DISTINCT
      COALESCE(namespace.nspname, '') AS schema_name,
      defaults.defaclobjtype AS object_type,
      CASE WHEN acl_entry.grantee=0 THEN 'PUBLIC' ELSE format('%I', grantee.rolname) END AS grantee_sql
    FROM pg_default_acl defaults
    JOIN pg_roles owner_role ON owner_role.oid=defaults.defaclrole
    LEFT JOIN pg_namespace namespace ON namespace.oid=defaults.defaclnamespace
    CROSS JOIN LATERAL aclexplode(defaults.defaclacl) acl_entry
    LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
    WHERE owner_role.rolname='compify_owner' AND acl_entry.grantee<>defaults.defaclrole
  LOOP
    EXECUTE format(
      'ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner %s REVOKE ALL ON %s FROM %s',
      CASE WHEN default_grant.schema_name='' THEN '' ELSE format('IN SCHEMA %I', default_grant.schema_name) END,
      CASE default_grant.object_type
        WHEN 'r' THEN 'TABLES' WHEN 'S' THEN 'SEQUENCES'
        WHEN 'f' THEN 'FUNCTIONS' WHEN 'T' THEN 'TYPES' WHEN 'n' THEN 'SCHEMAS'
      END,
      default_grant.grantee_sql
    );
  END LOOP;
END
$defaults$;
ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE compify_owner REVOKE USAGE ON TYPES FROM PUBLIC;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.cli_token, public.component, public.component_revision,
  public.external_component, public.newsletter, public.report,
  public.subscription, public.subscription_plan, public.themes, public.token,
  public.upvote, public."user", public.user_used_components
TO compify_runtime;
SQL
    ;;

  verify)
    : "${DB_RUNTIME_PASSWORD:?Set DB_RUNTIME_PASSWORD}"
    : "${LEGACY_DATABASE_OWNER:?Set LEGACY_DATABASE_OWNER to the bootstrap/break-glass role}"
    require_long_secret DB_RUNTIME_PASSWORD "$DB_RUNTIME_PASSWORD"
    case "$LEGACY_DATABASE_OWNER" in
      ''|*[!a-zA-Z0-9_]*|[0-9]*)
        echo "LEGACY_DATABASE_OWNER must be one unquoted PostgreSQL role identifier" >&2
        exit 1
        ;;
    esac
    runtime_psql <<'SQL'
SELECT set_config('compify.legacy_owner', :'legacy_owner', false);
DO $verify$
DECLARE
  table_name text;
  privilege_name text;
  unexpected text;
BEGIN
  IF session_user <> 'compify_runtime' OR current_user <> 'compify_runtime' THEN
    RAISE EXCEPTION 'runtime identity mismatch: session=%, current=%', session_user, current_user;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname='compify_runtime' AND rolcanlogin
      AND NOT (rolsuper OR rolinherit OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'compify_runtime has a forbidden role attribute or cannot log in';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.member
    WHERE r.rolname='compify_runtime'
  ) THEN
    RAISE EXCEPTION 'compify_runtime has a role membership';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_auth_members membership
    JOIN pg_roles parent ON parent.oid=membership.roleid
    JOIN pg_roles child ON child.oid=membership.member
    WHERE parent.rolname='compify_owner' AND child.rolname='compify_migrator'
      AND NOT membership.admin_option AND NOT membership.inherit_option AND membership.set_option
  ) OR EXISTS (
    SELECT 1
    FROM pg_auth_members membership
    JOIN pg_roles parent ON parent.oid=membership.roleid
    JOIN pg_roles child ON child.oid=membership.member
    WHERE (parent.rolname IN ('compify_owner','compify_migrator','compify_runtime')
           OR child.rolname IN ('compify_owner','compify_migrator','compify_runtime'))
      AND NOT (parent.rolname='compify_owner' AND child.rolname='compify_migrator'
               AND NOT membership.admin_option AND NOT membership.inherit_option AND membership.set_option)
  ) THEN
    RAISE EXCEPTION 'protected PostgreSQL role membership graph is not exact';
  END IF;
  IF NOT has_database_privilege(current_user, current_database(), 'CONNECT') OR
     has_database_privilege(current_user, current_database(), 'CREATE') OR
     has_database_privilege(current_user, current_database(), 'TEMPORARY') OR
     has_database_privilege('public', current_database(), 'CONNECT') OR
     has_database_privilege('public', current_database(), 'CREATE') OR
     has_database_privilege('public', current_database(), 'TEMPORARY') THEN
    RAISE EXCEPTION 'database CONNECT/CREATE/TEMPORARY policy mismatch';
  END IF;
  IF NOT has_schema_privilege(current_user, 'public', 'USAGE') OR
     has_schema_privilege(current_user, 'public', 'CREATE') OR
     has_schema_privilege('public', 'public', 'USAGE') OR
     has_schema_privilege('public', 'public', 'CREATE') THEN
    RAISE EXCEPTION 'public schema USAGE/CREATE policy mismatch';
  END IF;

  SELECT string_agg(
      format('%s:%s%s', COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type,
        CASE WHEN acl_entry.is_grantable THEN '*' ELSE '' END),
      ', ' ORDER BY COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type)
    INTO unexpected
  FROM pg_database database
  CROSS JOIN LATERAL aclexplode(COALESCE(database.datacl, acldefault('d', database.datdba))) acl_entry
  LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
  WHERE database.datname=current_database()
    AND NOT (
      acl_entry.grantee=database.datdba OR
      (grantee.rolname IN ('compify_migrator','compify_runtime',current_setting('compify.legacy_owner'))
       AND acl_entry.privilege_type='CONNECT' AND NOT acl_entry.is_grantable)
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'database ACL contains an unexpected grantee or privilege: %', unexpected;
  END IF;

  SELECT string_agg(
      format('%s:%s%s', COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type,
        CASE WHEN acl_entry.is_grantable THEN '*' ELSE '' END),
      ', ' ORDER BY COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type)
    INTO unexpected
  FROM pg_namespace namespace
  CROSS JOIN LATERAL aclexplode(COALESCE(namespace.nspacl, acldefault('n', namespace.nspowner))) acl_entry
  LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
  WHERE namespace.nspname='public'
    AND NOT (
      acl_entry.grantee=namespace.nspowner OR
      (grantee.rolname IN ('compify_migrator','compify_runtime')
       AND acl_entry.privilege_type='USAGE' AND NOT acl_entry.is_grantable)
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'public schema ACL contains an unexpected grantee or privilege: %', unexpected;
  END IF;

  SELECT string_agg(
      format('%s.%s->%s:%s%s', namespace.nspname, relation.relname,
        COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type,
        CASE WHEN acl_entry.is_grantable THEN '*' ELSE '' END),
      ', ' ORDER BY relation.relname, COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type)
    INTO unexpected
  FROM pg_class relation
  JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(
    relation.relacl,
    acldefault(CASE WHEN relation.relkind='S' THEN 'S'::"char" ELSE 'r'::"char" END, relation.relowner)
  )) acl_entry
  LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
  WHERE namespace.nspname='public' AND relation.relkind IN ('r','p','S','v','m','f')
    AND NOT (
      acl_entry.grantee=relation.relowner OR
      (relation.relkind IN ('r','p') AND relation.relname = ANY (ARRAY[
         'cli_token','component','component_revision','external_component',
         'newsletter','report','subscription','subscription_plan','themes',
         'token','upvote','user','user_used_components'
       ])
       AND grantee.rolname='compify_runtime'
       AND acl_entry.privilege_type = ANY (ARRAY['SELECT','INSERT','UPDATE','DELETE'])
       AND NOT acl_entry.is_grantable)
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'public relation ACL contains an unexpected grantee or privilege: %', unexpected;
  END IF;

  SELECT string_agg(
      format('%s.%s(%s)->%s:%s%s', namespace.nspname, relation.relname, attribute.attname,
        COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type,
        CASE WHEN acl_entry.is_grantable THEN '*' ELSE '' END),
      ', ' ORDER BY relation.relname, attribute.attname,
        COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type)
    INTO unexpected
  FROM pg_attribute attribute
  JOIN pg_class relation ON relation.oid=attribute.attrelid
  JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
  CROSS JOIN LATERAL aclexplode(attribute.attacl) acl_entry
  LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
  WHERE namespace.nspname='public' AND relation.relkind IN ('r','p','v','m','f')
    AND NOT attribute.attisdropped;
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'public column ACL contains an unexpected grant: %', unexpected;
  END IF;

  SELECT string_agg(
      format('%s.%s->%s:%s%s', namespace.nspname, type_entry.typname,
        COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type,
        CASE WHEN acl_entry.is_grantable THEN '*' ELSE '' END),
      ', ' ORDER BY type_entry.typname, COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type)
    INTO unexpected
  FROM pg_type type_entry
  JOIN pg_namespace namespace ON namespace.oid=type_entry.typnamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(type_entry.typacl, acldefault('T', type_entry.typowner))) acl_entry
  LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
  WHERE namespace.nspname='public' AND type_entry.typtype IN ('e','d')
    AND NOT (
      acl_entry.grantee=type_entry.typowner OR
      (grantee.rolname='compify_runtime' AND acl_entry.privilege_type='USAGE'
       AND NOT acl_entry.is_grantable)
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'public enum/domain ACL contains an unexpected grant: %', unexpected;
  END IF;

  SELECT string_agg(
      format('%s/%s->%s:%s%s', COALESCE(namespace.nspname, '<global>'), defaults.defaclobjtype,
        COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type,
        CASE WHEN acl_entry.is_grantable THEN '*' ELSE '' END),
      ', ' ORDER BY COALESCE(namespace.nspname, '<global>'), defaults.defaclobjtype,
        COALESCE(grantee.rolname, 'PUBLIC'), acl_entry.privilege_type)
    INTO unexpected
  FROM pg_default_acl defaults
  JOIN pg_roles owner_role ON owner_role.oid=defaults.defaclrole
  LEFT JOIN pg_namespace namespace ON namespace.oid=defaults.defaclnamespace
  CROSS JOIN LATERAL aclexplode(defaults.defaclacl) acl_entry
  LEFT JOIN pg_roles grantee ON grantee.oid=acl_entry.grantee
  WHERE owner_role.rolname='compify_owner' AND acl_entry.grantee<>defaults.defaclrole;
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'compify_owner default ACL contains an unexpected grantee: %', unexpected;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND pg_get_userbyid(c.relowner)=current_user
  ) OR EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
    WHERE n.nspname='public' AND pg_get_userbyid(t.typowner)=current_user
  ) OR EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND pg_get_userbyid(p.proowner)=current_user
  ) THEN
    RAISE EXCEPTION 'compify_runtime owns a public object';
  END IF;

  FOREACH table_name IN ARRAY ARRAY[
    'cli_token','component','component_revision','external_component',
    'newsletter','report','subscription','subscription_plan','themes',
    'token','upvote','user','user_used_components'
  ]
  LOOP
    FOREACH privilege_name IN ARRAY ARRAY['SELECT','INSERT','UPDATE','DELETE']
    LOOP
      IF NOT has_table_privilege(current_user, format('public.%I', table_name), privilege_name) THEN
        RAISE EXCEPTION 'missing runtime % on public.%', privilege_name, table_name;
      END IF;
    END LOOP;
    FOREACH privilege_name IN ARRAY ARRAY['TRUNCATE','REFERENCES','TRIGGER']
    LOOP
      IF has_table_privilege(current_user, format('public.%I', table_name), privilege_name) THEN
        RAISE EXCEPTION 'forbidden runtime % on public.%', privilege_name, table_name;
      END IF;
    END LOOP;
  END LOOP;

  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO unexpected
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
    AND c.relname <> ALL (ARRAY[
      'cli_token','component','component_revision','external_component',
      'newsletter','report','subscription','subscription_plan','themes',
      'token','upvote','user','user_used_components'
    ])
    AND (
      has_table_privilege(current_user,c.oid,'SELECT') OR
      has_table_privilege(current_user,c.oid,'INSERT') OR
      has_table_privilege(current_user,c.oid,'UPDATE') OR
      has_table_privilege(current_user,c.oid,'DELETE') OR
      has_table_privilege(current_user,c.oid,'TRUNCATE') OR
      has_table_privilege(current_user,c.oid,'REFERENCES') OR
      has_table_privilege(current_user,c.oid,'TRIGGER')
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'runtime can access non-allowlisted tables: %', unexpected;
  END IF;

  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO unexpected
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='S'
    AND (
      has_sequence_privilege(current_user,c.oid,'SELECT') OR
      has_sequence_privilege(current_user,c.oid,'UPDATE') OR
      has_sequence_privilege(current_user,c.oid,'USAGE')
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'runtime can access public sequences: %', unexpected;
  END IF;

  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO unexpected
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p','v','m','f')
    AND (
      has_table_privilege('public',c.oid,'SELECT') OR
      has_table_privilege('public',c.oid,'INSERT') OR
      has_table_privilege('public',c.oid,'UPDATE') OR
      has_table_privilege('public',c.oid,'DELETE') OR
      has_table_privilege('public',c.oid,'TRUNCATE') OR
      has_table_privilege('public',c.oid,'REFERENCES') OR
      has_table_privilege('public',c.oid,'TRIGGER')
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'PUBLIC can access application tables: %', unexpected;
  END IF;

  SELECT string_agg(c.relname, ', ' ORDER BY c.relname) INTO unexpected
  FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='S'
    AND (
      has_sequence_privilege('public',c.oid,'SELECT') OR
      has_sequence_privilege('public',c.oid,'UPDATE') OR
      has_sequence_privilege('public',c.oid,'USAGE')
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'PUBLIC can access application sequences: %', unexpected;
  END IF;

  SELECT string_agg(
      format('%s(%s)%s', p.proname, pg_get_function_identity_arguments(p.oid),
        CASE WHEN p.prosecdef THEN ' SECURITY DEFINER' ELSE '' END),
      ', ' ORDER BY p.proname, pg_get_function_identity_arguments(p.oid))
    INTO unexpected
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public'
    AND (
      p.prosecdef OR NOT EXISTS (
        SELECT 1 FROM pg_depend d JOIN pg_extension e ON e.oid=d.refobjid
        WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e'
          AND e.extname = ANY (ARRAY['uuid-ossp','pg_trgm','btree_gin'])
      )
    );
  IF unexpected IS NOT NULL THEN
    RAISE EXCEPTION 'runtime-visible public functions are unclassified or SECURITY DEFINER: %', unexpected;
  END IF;
END
$verify$;
SELECT 1 FROM public.component LIMIT 0;
SQL
    expect_runtime_denied() {
      statement=$1
      label=$2
      if runtime_psql -q -c "$statement" >/dev/null 2>&1; then
        echo "compify_runtime unexpectedly succeeded: $label" >&2
        exit 1
      fi
    }
    expect_runtime_denied       'BEGIN; CREATE TABLE public.compify_runtime_must_not_create(id integer); ROLLBACK'       'create a public table'
    expect_runtime_denied       'BEGIN; CREATE TEMPORARY TABLE compify_runtime_must_not_create(id integer); ROLLBACK'       'create a temporary table'
    expect_runtime_denied       'BEGIN; CREATE SCHEMA compify_runtime_must_not_create; ROLLBACK'       'create a schema'
    expect_runtime_denied       'BEGIN; CREATE FUNCTION public.compify_runtime_must_not_create() RETURNS integer LANGUAGE sql AS $$ SELECT 1 $$; ROLLBACK'       'create a public function'
    expect_runtime_denied 'SET ROLE compify_owner' 'assume compify_owner'
    ;;

  *)
    echo "Unknown POSTGRES_ROLE_PHASE: $phase" >&2
    exit 1
    ;;
esac
