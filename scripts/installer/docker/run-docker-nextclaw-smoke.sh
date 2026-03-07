#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${ROOT_DIR}/../../.." && pwd)"
IMAGE_TAG="nextclaw-installer-node-smoke:latest"

export PATH="/opt/homebrew/bin:/usr/local/bin:/Applications/Docker.app/Contents/Resources/bin:${PATH}"

if ! command -v docker >/dev/null 2>&1; then
  echo "[smoke-nextclaw] docker not found in PATH"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[smoke-nextclaw] npm not found in PATH (used for packing local nextclaw tgz)"
  exit 1
fi

echo "[smoke-nextclaw] ensure docker image exists..."
docker build -t "${IMAGE_TAG}" "${ROOT_DIR}" >/dev/null

echo "[smoke-nextclaw] build local nextclaw package..."
(
  cd "${REPO_ROOT}/packages/nextclaw"
  npm pack --silent >/tmp/nextclaw-pack-name.txt
)
TGZ_NAME="$(tail -n 1 /tmp/nextclaw-pack-name.txt | tr -d '\r\n')"
TGZ_PATH="${REPO_ROOT}/packages/nextclaw/${TGZ_NAME}"
if [[ ! -f "${TGZ_PATH}" ]]; then
  echo "[smoke-nextclaw] packed tgz not found: ${TGZ_PATH}"
  exit 1
fi

run_case() {
  local case_name="$1"
  local dist_bases="$2"
  local container_script="/tmp/nextclaw-container-smoke-$$.sh"

  cat >"${container_script}" <<'INNER'
#!/usr/bin/env bash
set -euo pipefail

source /work/smoke-node-bootstrap.sh
mkdir -p /tmp/app /tmp/home
cd /tmp/app
npm init -y >/dev/null 2>&1
npm install --omit=dev --no-audit --no-fund /work/nextclaw.tgz >/tmp/npm-install.log 2>&1

export HOME=/tmp/home
CLI="node_modules/nextclaw/dist/cli/index.js"

node "$CLI" init --force >/tmp/init.log 2>&1
node "$CLI" start --ui-port 19091 >/tmp/start.log 2>&1
test -f /tmp/home/.nextclaw/run/service.json
curl -sSf http://127.0.0.1:19091/ >/tmp/ui.html

set +e
node "$CLI" plugins install @types/node >/tmp/plugins.log 2>&1
PLUGIN_CODE=$?
node "$CLI" skills install definitely-not-exist-skill --api-base http://127.0.0.1:65535 --workdir /tmp/app --dir skills >/tmp/skills.log 2>&1
SKILLS_CODE=$?
set -e

if grep -Eqi '(npm|npx).*(not found|ENOENT)|command not found' /tmp/plugins.log; then
  echo "[smoke-nextclaw] plugin install path missing npm/npx"
  sed -n '1,120p' /tmp/plugins.log
  exit 1
fi
if grep -Eqi '(npm|npx).*(not found|ENOENT)|command not found' /tmp/skills.log; then
  echo "[smoke-nextclaw] skills install path missing npm/npx"
  sed -n '1,120p' /tmp/skills.log
  exit 1
fi

node "$CLI" stop >/tmp/stop.log 2>&1

echo "[smoke-nextclaw] init/start/stop ok"
echo "[smoke-nextclaw] plugins install exit code: ${PLUGIN_CODE}"
echo "[smoke-nextclaw] skills install exit code: ${SKILLS_CODE}"
sed -n '1,40p' /tmp/start.log
INNER

  chmod +x "${container_script}"
  echo "[smoke-nextclaw] case: ${case_name}"
  docker run --rm \
    --entrypoint /bin/bash \
    -e NEXTCLAW_NODE_DIST_BASES="${dist_bases}" \
    -v "${TGZ_PATH}:/work/nextclaw.tgz" \
    -v "${container_script}:/work/nextclaw-container-smoke.sh" \
    "${IMAGE_TAG}" \
    /work/nextclaw-container-smoke.sh

  rm -f "${container_script}"
}

run_case "default-mirror-order" "https://npmmirror.com/mirrors/node,https://nodejs.org/dist"
run_case "fallback-first-mirror-invalid" "https://invalid-mirror.example.com,https://npmmirror.com/mirrors/node,https://nodejs.org/dist"

echo "[smoke-nextclaw] done"
