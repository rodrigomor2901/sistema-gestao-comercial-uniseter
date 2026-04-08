$env:NODE_ENV="production"
$env:HOST="0.0.0.0"
$env:PORT="3100"
$env:APP_BASE_URL="http://SERVIDOR-EMPRESA:3100"
$env:APP_UPLOADS_DIR="C:\SistemaGestaoComercial\uploads"
$env:SESSION_TTL_HOURS="12"

$env:PGHOST="localhost"
$env:PGPORT="5432"
$env:PGDATABASE="crm_propostas"
$env:PGUSER="postgres"
$env:PGPASSWORD="SUA_SENHA_AQUI"

# Opcional para banco com SSL
# $env:PGSSLMODE="require"
# $env:DB_SSL="true"

# Ajustes do pool de conexoes
$env:PGPOOL_MAX="20"
$env:PG_IDLE_TIMEOUT_MS="30000"
$env:PG_CONNECT_TIMEOUT_MS="10000"
