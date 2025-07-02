#!/bin/bash

# Development Server Manager
# Usage: ./scripts/dev-server.sh [start|stop|restart|status|logs]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOG_DIR/server-pids.json"
LOG_FILE="$LOG_DIR/dev-server-$(date +%Y%m%d).log"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs)
fi

DEV_SERVER_PORT=${DEV_SERVER_PORT:-3000}

# Utility functions
log_message() {
    local level=$1
    local message=$2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

get_dev_server_pid() {
    if [ -f "$PID_FILE" ]; then
        python3 -c "
import json, sys
try:
    with open('$PID_FILE', 'r') as f:
        data = json.load(f)
    print(data.get('dev-server', {}).get('pid', ''))
except:
    pass
" 2>/dev/null
    fi
}

update_pid_file() {
    local action=$1
    local pid=$2
    
    python3 -c "
import json, sys, os
from datetime import datetime

pid_file = '$PID_FILE'
try:
    if os.path.exists(pid_file):
        with open(pid_file, 'r') as f:
            content = f.read().strip()
            if content:
                data = json.loads(content)
            else:
                data = {}
    else:
        data = {}
except Exception as e:
    print(f'Error reading PID file: {e}', file=sys.stderr)
    data = {}

if '$action' == 'add':
    data['dev-server'] = {
        'pid': int($pid) if '$pid' else None,
        'port': int($DEV_SERVER_PORT),
        'started_at': datetime.now().isoformat(),
        'log_file': '$LOG_FILE'
    }
elif '$action' == 'remove':
    data.pop('dev-server', None)

try:
    with open(pid_file, 'w') as f:
        json.dump(data, f, indent=2)
        f.write('\n')
except Exception as e:
    print(f'Error writing PID file: {e}', file=sys.stderr)
    sys.exit(1)
"
}

is_process_running() {
    local pid=$1
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

start_dev_server() {
    local existing_pid=$(get_dev_server_pid)
    
    if [ -n "$existing_pid" ] && is_process_running "$existing_pid"; then
        log_message "WARN" "Dev server already running with PID $existing_pid"
        return 0
    fi
    
    log_message "INFO" "Starting development server on port $DEV_SERVER_PORT..."
    
    cd "$PROJECT_ROOT"
    # Start in a new process group so we can kill all child processes
    nohup setsid npm run dev > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # Wait a moment to ensure the process started
    sleep 2
    
    if is_process_running "$pid"; then
        update_pid_file "add" "$pid"
        log_message "INFO" "Dev server started successfully with PID $pid"
        echo "✅ Development server started on http://localhost:$DEV_SERVER_PORT"
        echo "📋 PID: $pid"
        echo "📝 Logs: $LOG_FILE"
    else
        log_message "ERROR" "Failed to start dev server"
        echo "❌ Failed to start development server"
        return 1
    fi
}

stop_dev_server() {
    local pid=$(get_dev_server_pid)
    
    if [ -z "$pid" ]; then
        log_message "WARN" "No dev server PID found"
        echo "⚠️  No development server found"
        return 0
    fi
    
    if is_process_running "$pid"; then
        log_message "INFO" "Stopping dev server with PID $pid..."
        
        # Kill the entire process group to ensure all child processes are terminated
        # This is crucial for Node.js applications that spawn multiple processes
        if kill -TERM -"$pid" 2>/dev/null; then
            log_message "INFO" "Sent TERM signal to process group $pid"
        else
            # Fallback to killing just the main process
            kill -TERM "$pid" 2>/dev/null
            log_message "INFO" "Sent TERM signal to process $pid"
        fi
        
        # Wait for graceful shutdown
        local count=0
        while is_process_running "$pid" && [ $count -lt 10 ]; do
            sleep 1
            count=$((count + 1))
        done
        
        # Force kill if still running
        if is_process_running "$pid"; then
            log_message "WARN" "Process still running, force killing..."
            if kill -KILL -"$pid" 2>/dev/null; then
                log_message "WARN" "Force killed process group $pid"
            else
                kill -KILL "$pid" 2>/dev/null
                log_message "WARN" "Force killed process $pid"
            fi
            sleep 2
        fi
        
        # Verify the process is dead
        if is_process_running "$pid"; then
            log_message "ERROR" "Failed to kill process $pid"
            echo "❌ Failed to stop development server"
            return 1
        else
            log_message "INFO" "Dev server stopped successfully"
            update_pid_file "remove"
            echo "✅ Development server stopped"
        fi
    else
        log_message "WARN" "Dev server process $pid not running"
        update_pid_file "remove"
        echo "⚠️  Development server was not running"
    fi
}

restart_dev_server() {
    echo "🔄 Restarting development server..."
    stop_dev_server
    sleep 1
    start_dev_server
}

show_status() {
    local pid=$(get_dev_server_pid)
    
    echo "📊 Development Server Status"
    echo "================================"
    
    if [ -z "$pid" ]; then
        echo "Status: ❌ Not running"
        return 0
    fi
    
    if is_process_running "$pid"; then
        echo "Status: ✅ Running"
        echo "PID: $pid"
        echo "Port: $DEV_SERVER_PORT"
        echo "URL: http://localhost:$DEV_SERVER_PORT"
        echo "Log file: $LOG_FILE"
        
        # Show resource usage
        if command -v ps >/dev/null 2>&1; then
            echo ""
            echo "Resource Usage:"
            ps -p "$pid" -o pid,ppid,pcpu,pmem,etime,cmd --no-headers 2>/dev/null || echo "Unable to get process info"
        fi
    else
        echo "Status: ❌ Not running (stale PID: $pid)"
        update_pid_file "remove"
    fi
}

show_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        echo "📝 No log file found: $LOG_FILE"
        return 1
    fi
    
    echo "📝 Development Server Logs (Press Ctrl+C to exit)"
    echo "================================================"
    tail -f "$LOG_FILE"
}

# Main command handler
case "${1:-}" in
    start)
        start_dev_server
        ;;
    stop)
        stop_dev_server
        ;;
    restart)
        restart_dev_server
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the development server in background"
        echo "  stop    - Stop the development server"
        echo "  restart - Restart the development server"
        echo "  status  - Show server status and resource usage"
        echo "  logs    - Show real-time logs"
        echo ""
        echo "Environment variables:"
        echo "  DEV_SERVER_PORT - Port for development server (default: 3000)"
        exit 1
        ;;
esac