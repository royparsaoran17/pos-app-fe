#!/bin/sh
set -e

# Generate runtime config from environment
CONFIG_FILE=/app/.output/public/config.js

cat > $CONFIG_FILE << EOF
window.__APP_CONFIG__ = {
  apiBase: "${API_BASE_URL:-http://localhost:9005}"
};
EOF

echo "Generated config with API_BASE_URL=${API_BASE_URL:-http://localhost:9005}"

exec node .output/server/index.mjs
