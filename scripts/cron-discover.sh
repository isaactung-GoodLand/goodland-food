#!/bin/bash
# Daily discover-stores cron wrapper
# 每天 03:00 台北時區本地 cron 觸發
# 直接寫進 prod DB (透過 secure env file)

set -euo pipefail

export TZ="Asia/Taipei"
export PATH="/usr/local/bin:/usr/bin:/bin:/home/ihermes/.npm-global/bin:$PATH"

PROJECT_DIR="/home/ihermes/goodland/goodland-food"
LOG_DIR="$PROJECT_DIR/discover-logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/cron-$(date +%Y%m%d).log"

cd "$PROJECT_DIR"

# 1. 載入 secure env (DATABASE_URL 等)
SECRET_ENV="/home/ihermes/.env.goodland-cron"
if [ ! -f "$SECRET_ENV" ]; then
  echo "===== $(date '+%Y-%m-%d %H:%M:%S %Z') =====" | tee -a "$LOG_FILE"
  echo "MISSING $SECRET_ENV" | tee -a "$LOG_FILE"
  exit 1
fi
# shellcheck disable=SC1090
source "$SECRET_ENV"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "===== $(date '+%Y-%m-%d %H:%M:%S %Z') =====" | tee -a "$LOG_FILE"
  echo "DATABASE_URL not set after source" | tee -a "$LOG_FILE"
  exit 1
fi

# 2. 從 today 算今天該跑哪個縣市
DAY=$(date -u +%-d)
CITY=$(npx tsx -e "
  import { getCityForDay } from './src/lib/cron-schedule';
  const d = new Date();
  d.setUTCDate($DAY);
  console.log(getCityForDay(d));
" 2>&1 | tail -1)

echo "===== $(date '+%Y-%m-%d %H:%M:%S %Z') =====" | tee -a "$LOG_FILE"
echo "Today: $CITY" | tee -a "$LOG_FILE"
echo "Database target: postgresql://***@... neondb (loaded from secure file)" | tee -a "$LOG_FILE"

# 3. 跑 discover + write
npx tsx scripts/discover-stores.ts "$CITY" --write 2>&1 | tee -a "$LOG_FILE"

echo "===== done =====" | tee -a "$LOG_FILE"
