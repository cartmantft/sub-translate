#!/bin/bash

# Test Report Server Manager
# Usage: ./scripts/test-server.sh [start|stop|status|clean] [port]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOG_DIR/server-pids.json"
LOG_FILE="$LOG_DIR/test-server-$(date +%Y%m%d).log"
REPORT_DIR="$PROJECT_ROOT/tests/playwright-report"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs)
fi

TEST_SERVER_PORT=${TEST_SERVER_PORT:-4000}
if [ -n "$2" ]; then
    TEST_SERVER_PORT=$2
fi

# Utility functions
log_message() {
    local level=$1
    local message=$2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

get_test_server_pid() {
    if [ -f "$PID_FILE" ]; then
        python3 -c "
import json, sys
try:
    with open('$PID_FILE', 'r') as f:
        data = json.load(f)
    print(data.get('test-server', {}).get('pid', ''))
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
    data['test-server'] = {
        'pid': int($pid) if '$pid' else None,
        'port': int($TEST_SERVER_PORT),
        'started_at': datetime.now().isoformat(),
        'log_file': '$LOG_FILE'
    }
elif '$action' == 'remove':
    data.pop('test-server', None)

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

check_report_exists() {
    if [ ! -d "$REPORT_DIR" ] || [ ! -f "$REPORT_DIR/index.html" ]; then
        echo "❌ No test report found. Run tests first:"
        echo "   npx playwright test"
        return 1
    fi
    return 0
}

start_test_server() {
    local existing_pid=$(get_test_server_pid)
    
    if [ -n "$existing_pid" ] && is_process_running "$existing_pid"; then
        log_message "WARN" "Test server already running with PID $existing_pid on port $TEST_SERVER_PORT"
        echo "⚠️  Test server already running on http://localhost:$TEST_SERVER_PORT"
        return 0
    fi
    
    if ! check_report_exists; then
        return 1
    fi
    
    log_message "INFO" "Starting test report server on port $TEST_SERVER_PORT..."
    
    cd "$PROJECT_ROOT"
    # Start in a new process group so we can kill all child processes
    nohup setsid npx playwright show-report --port "$TEST_SERVER_PORT" > "$LOG_FILE" 2>&1 &
    local pid=$!
    
    # Wait a moment to ensure the process started
    sleep 2
    
    if is_process_running "$pid"; then
        update_pid_file "add" "$pid"
        log_message "INFO" "Test server started successfully with PID $pid"
        echo "✅ Test report server started on http://localhost:$TEST_SERVER_PORT"
        echo "📋 PID: $pid"
        echo "📝 Logs: $LOG_FILE"
        echo "📊 Report: $REPORT_DIR"
    else
        log_message "ERROR" "Failed to start test server"
        echo "❌ Failed to start test report server"
        return 1
    fi
}

stop_test_server() {
    local pid=$(get_test_server_pid)
    
    if [ -z "$pid" ]; then
        log_message "WARN" "No test server PID found"
        echo "⚠️  No test report server found"
        return 0
    fi
    
    if is_process_running "$pid"; then
        log_message "INFO" "Stopping test server with PID $pid..."
        
        # Kill the entire process group to ensure all child processes are terminated
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
            echo "❌ Failed to stop test report server"
            return 1
        else
            log_message "INFO" "Test server stopped successfully"
            update_pid_file "remove"
            echo "✅ Test report server stopped"
        fi
    else
        log_message "WARN" "Test server process $pid not running"
        update_pid_file "remove"
        echo "⚠️  Test report server was not running"
    fi
}

show_status() {
    local pid=$(get_test_server_pid)
    
    echo "📊 Test Report Server Status"
    echo "============================="
    
    if [ -z "$pid" ]; then
        echo "Status: ❌ Not running"
        
        if check_report_exists; then
            echo "Report: ✅ Available"
            echo "Report path: $REPORT_DIR"
        else
            echo "Report: ❌ Not available"
        fi
        return 0
    fi
    
    if is_process_running "$pid"; then
        echo "Status: ✅ Running"
        echo "PID: $pid"
        echo "Port: $TEST_SERVER_PORT"
        echo "URL: http://localhost:$TEST_SERVER_PORT"
        echo "Log file: $LOG_FILE"
        echo "Report path: $REPORT_DIR"
        
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

clean_old_reports() {
    echo "🧹 Cleaning old test reports..."
    
    local retention_days=${LOG_RETENTION_DAYS:-7}
    
    if [ -d "$REPORT_DIR" ]; then
        echo "Cleaning reports older than $retention_days days..."
        find "$REPORT_DIR" -name "*.html" -mtime +$retention_days -delete 2>/dev/null || true
        find "$REPORT_DIR" -name "*.json" -mtime +$retention_days -delete 2>/dev/null || true
        find "$REPORT_DIR/data" -name "*.md" -mtime +$retention_days -delete 2>/dev/null || true
        echo "✅ Old reports cleaned"
    fi
    
    if [ -d "$LOG_DIR" ]; then
        echo "Cleaning test server logs older than $retention_days days..."
        find "$LOG_DIR" -name "test-server-*.log" -mtime +$retention_days -delete 2>/dev/null || true
        echo "✅ Old logs cleaned"
    fi
}

# Main command handler
case "${1:-}" in
    start)
        start_test_server
        ;;
    stop)
        stop_test_server
        ;;
    status)
        show_status
        ;;
    clean)
        clean_old_reports
        ;;
    *)
        echo "Usage: $0 {start|stop|status|clean} [port]"
        echo ""
        echo "Commands:"
        echo "  start [port] - Start the test report server (default port: $TEST_SERVER_PORT)"
        echo "  stop         - Stop the test report server"
        echo "  status       - Show server status and report info"
        echo "  clean        - Clean old reports and logs"
        echo ""
        echo "Examples:"
        echo "  $0 start      # Start on default port ($TEST_SERVER_PORT)"
        echo "  $0 start 8080 # Start on port 8080"
        echo "  $0 status     # Check status"
        echo "  $0 stop       # Stop server"
        echo ""
        echo "Environment variables:"
        echo "  TEST_SERVER_PORT    - Port for test server (default: 4000)"
        echo "  LOG_RETENTION_DAYS  - Days to keep logs (default: 7)"
        exit 1
        ;;
esac