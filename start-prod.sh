#!/bin/bash

# 🎨 Color Definitions
CYAN='\033[0;36m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 🧹 Clear screen for a fresh TUI
clear

# 🚀 Banner
echo -e "${BLUE}${BOLD}"
cat << "EOF"
    ____                           _     
   / __ \____ _________      _(_)___ 
  / / / / __ `/ ___/ | /| / / / __ \
 / /_/ / /_/ / /   | |/ |/ / / / / /
/_____/\__,_/_/    |__/|__/_/_/ /_/ 
EOF
echo -e "${NC}"
echo -e "${CYAN}======================================================${NC}"
echo -e "${BOLD}🧬 Initializing Digital Twin Ecosystem (PRODUCTION)...${NC}\n"

# 📄 Create/clear log files
touch .backend.log .frontend.log
> .backend.log
> .frontend.log

# 🧠 Start Backend (FastAPI)
echo -e "🚀 ${PURPLE}Booting AI Core (FastAPI on Port 8000)...${NC}"
if [ -d "backend/venv" ]; then
    (cd backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8000) > .backend.log 2>&1 &
else
    # Fallback if running globally or managed externally
    (cd backend && uvicorn main:app --host 0.0.0.0 --port 8000) > .backend.log 2>&1 &
fi
BACKEND_PID=$!

# 💻 Start Frontend (Next.js)
echo -e "🚀 ${CYAN}Booting Client Interface (Next.js Production on Port 3000)...${NC}"
(cd frontend && npm start) > .frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 1 # Give processes a moment to boot

echo -e "\n${GREEN}✔ All systems online.${NC}"
echo -e "${YELLOW}→ Backend running on  http://localhost:8000${NC}"
echo -e "${YELLOW}→ Frontend running on http://localhost:3000${NC}"
echo -e "${CYAN}======================================================${NC}"
echo -e "${BOLD}Streaming live logs (Press Ctrl+C to shut down both)...${NC}\n"

# 🛑 Trap Ctrl+C to gracefully kill both background processes
trap "echo -e '\n\n${YELLOW}🛑 Shutting down Darwin ecosystem...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 🖥️ TUI Log Streamer (Prefixes logs with colored tags)
tail -f .backend.log .frontend.log | awk '
  /^==> \.backend\.log <==$/ { prefix="\033[0;35m[CORE]\033[0m"; next }
  /^==> \.frontend\.log <==$/ { prefix="\033[0;36m[CLIENT]\033[0m"; next }
  /^==> .* <==$/ { next }
  prefix == "" { prefix="\033[1;30m[SYS]\033[0m" }
  { print prefix " " $0 }
'
