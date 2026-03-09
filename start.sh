#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== BEV STAC Viewer Startup ===${NC}"

# Kill existing processes on ports 5000 and 5173
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
sleep 1

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}Shutting down servers...${NC}"
    if [ ! -z "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null
    fi
    if [ ! -z "$VITE_PID" ]; then
        kill $VITE_PID 2>/dev/null
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# Check if Python dependencies are installed
echo -e "${YELLOW}Checking Python dependencies...${NC}"
if ! python3 -c "import flask" 2>/dev/null; then
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    pip install -r requirements.txt
fi

# Start Flask backend
echo -e "${YELLOW}Starting Flask backend on port 5000...${NC}"
python3 server.py > /tmp/flask.log 2>&1 &
FLASK_PID=$!
sleep 3

# Check if Flask started successfully
if ! kill -0 $FLASK_PID 2>/dev/null; then
    echo -e "${RED}Failed to start Flask server${NC}"
    cat /tmp/flask.log
    exit 1
fi
echo -e "${GREEN}Flask started (PID: $FLASK_PID)${NC}"

# Start Vite dev server
echo -e "${YELLOW}Starting Vite dev server on port 5173...${NC}"
npm run dev > /tmp/vite.log 2>&1 &
VITE_PID=$!

# Wait for Vite to start
sleep 4

# Get the actual port Vite is using
VITE_PORT=$(grep -oP "Local:.*http://localhost:\K\d+" /tmp/vite.log 2>/dev/null || echo "5173")

echo -e "${GREEN}=== All servers running ===${NC}"
echo -e "  Flask API:   http://localhost:5000"
echo -e "  Frontend:   http://localhost:$VITE_PORT"
echo -e ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Wait for either process to die
wait $VITE_PID
