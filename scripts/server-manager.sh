#!/bin/bash

# Unified Server Manager
# Usage: ./scripts/server-manager.sh [start-all|stop-all|restart-all|status-all|cleanup]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOG_DIR/server-pids.json"
LOG_FILE="$LOG_DIR/server-manager-$(date +%Y%m%d).log"

DEV_SERVER_SCRIPT="$PROJECT_ROOT/scripts/dev-server.sh"
TEST_SERVER_SCRIPT="$PROJECT_ROOT/scripts/test-server.sh"
CLEANUP_SCRIPT="$PROJECT_ROOT/scripts/cleanup.sh"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs)
fi

# Utility functions
log_message() {
    local level=$1
    local message=$2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

print_header() {
    local title=$1
    echo ""
    echo "🚀 $title"
    echo "$(printf '%*s' ${#title} '' | tr ' ' '=')"
}

print_separator() {
    echo ""
    echo "$(printf '%*s' 50 '' | tr ' ' '-')"
}

start_all_servers() {
    print_header "Starting All Servers"
    
    log_message "INFO" "Starting all servers..."
    
    # Check if AUTO_CLEANUP_ON_START is enabled (default: true)
    if [ "${AUTO_CLEANUP_ON_START:-true}" = "true" ]; then
        echo "🧹 Pre-startup cleanup (disable with AUTO_CLEANUP_ON_START=false)..."
        cleanup_processes
        print_separator
    fi
    
    echo "📦 Starting development server..."
    if "$DEV_SERVER_SCRIPT" start; then
        echo "✅ Development server started"
    else
        echo "❌ Failed to start development server"
        return 1
    fi
    
    print_separator
    
    echo "📊 Starting test report server..."
    if "$TEST_SERVER_SCRIPT" start; then
        echo "✅ Test report server started"
    else
        echo "⚠️  Test report server failed (reports may not be available)"
    fi
    
    print_separator
    show_all_status
    
    log_message "INFO" "All servers startup completed"
    echo ""
    echo "🎉 Server startup completed!"
    echo "📋 Use 'npm run servers:status' to check status"
}

stop_all_servers() {
    print_header "Stopping All Servers"
    
    log_message "INFO" "Stopping all servers..."
    
    echo "📊 Stopping test report server..."
    "$TEST_SERVER_SCRIPT" stop
    
    print_separator
    
    echo "📦 Stopping development server..."
    "$DEV_SERVER_SCRIPT" stop
    
    print_separator
    
    log_message "INFO" "All servers stopped"
    echo "✅ All servers stopped successfully"
}

restart_all_servers() {
    print_header "Restarting All Servers"
    
    log_message "INFO" "Restarting all servers..."
    
    stop_all_servers
    sleep 2
    start_all_servers
    
    log_message "INFO" "All servers restarted"
}

show_all_status() {
    print_header "Server Status Overview"
    
    echo "📦 Development Server:"
    "$DEV_SERVER_SCRIPT" status
    
    print_separator
    
    echo "📊 Test Report Server:"
    "$TEST_SERVER_SCRIPT" status
    
    print_separator
    
    # Show system resource usage
    echo "💻 System Resources:"
    if command -v free >/dev/null 2>&1; then
        echo "Memory usage:"
        free -h | head -2
    fi
    
    if command -v df >/dev/null 2>&1; then
        echo "Disk usage:"
        df -h . | tail -1
    fi
    
    # Show port usage
    echo ""
    echo "🌐 Port Usage:"
    if command -v ss >/dev/null 2>&1; then
        ss -tlnp | grep -E ":(3000|3001|4000|9323)" | head -5 || echo "No servers found on common ports"
    else
        netstat -tlnp 2>/dev/null | grep -E ":(3000|3001|4000|9323)" | head -5 || echo "No servers found on common ports"
    fi
}

cleanup_processes() {
    print_header "Cleaning Up Processes"
    
    log_message "INFO" "Starting cleanup process..."
    
    if [ -f "$CLEANUP_SCRIPT" ]; then
        echo "🧹 Running cleanup script..."
        "$CLEANUP_SCRIPT"
    else
        echo "🧹 Manual cleanup..."
        
        # Kill any orphaned Next.js processes
        echo "Cleaning up Next.js processes..."
        pkill -f "next dev" 2>/dev/null || true
        pkill -f "next-server" 2>/dev/null || true
        
        # Kill any orphaned Playwright processes
        echo "Cleaning up Playwright processes..."
        pkill -f "playwright.*show-report" 2>/dev/null || true
        
        # Clean up PID file
        if [ -f "$PID_FILE" ]; then
            echo "Cleaning up PID file..."
            rm -f "$PID_FILE"
        fi
        
        echo "✅ Manual cleanup completed"
    fi
    
    # Clean up old logs
    echo "🧹 Cleaning up old logs..."
    local retention_days=${LOG_RETENTION_DAYS:-7}
    find "$LOG_DIR" -name "*.log" -mtime +$retention_days -delete 2>/dev/null || true
    
    log_message "INFO" "Cleanup completed"
    echo "✅ Cleanup completed successfully"
}

show_help() {
    echo "🚀 SubTranslate Server Manager"
    echo "=============================="
    echo ""
    echo "Usage: $0 {start-all|stop-all|restart-all|status-all|cleanup}"
    echo ""
    echo "Commands:"
    echo "  start-all   - Start development and test report servers"
    echo "  stop-all    - Stop all servers"
    echo "  restart-all - Restart all servers"
    echo "  status-all  - Show status of all servers and system resources"
    echo "  cleanup     - Clean up orphaned processes and old logs"
    echo ""
    echo "Individual server management:"
    echo "  ./scripts/dev-server.sh {start|stop|restart|status|logs}"
    echo "  ./scripts/test-server.sh {start|stop|status|clean}"
    echo ""
    echo "Quick npm commands:"
    echo "  npm run servers:start   # Same as start-all"
    echo "  npm run servers:stop    # Same as stop-all"
    echo "  npm run servers:status  # Same as status-all"
    echo "  npm run servers:cleanup # Same as cleanup"
    echo ""
    echo "Environment variables:"
    echo "  DEV_SERVER_PORT     - Development server port (default: 3001)"
    echo "  TEST_SERVER_PORT    - Test report server port (default: 4000)"
    echo "  LOG_RETENTION_DAYS  - Days to keep logs (default: 7)"
}

# Health check function
health_check() {
    local dev_pid=$(cd "$PROJECT_ROOT" && "$DEV_SERVER_SCRIPT" status | grep "PID:" | awk '{print $2}')
    local test_pid=$(cd "$PROJECT_ROOT" && "$TEST_SERVER_SCRIPT" status | grep "PID:" | awk '{print $2}')
    
    local issues=0
    
    if [ -n "$dev_pid" ]; then
        if ! kill -0 "$dev_pid" 2>/dev/null; then
            echo "⚠️  Development server process $dev_pid is not responding"
            issues=$((issues + 1))
        fi
    fi
    
    if [ -n "$test_pid" ]; then
        if ! kill -0 "$test_pid" 2>/dev/null; then
            echo "⚠️  Test server process $test_pid is not responding"
            issues=$((issues + 1))
        fi
    fi
    
    if [ $issues -eq 0 ]; then
        echo "✅ All servers are healthy"
    else
        echo "⚠️  Found $issues server issues"
        echo "💡 Run '$0 cleanup' to fix issues"
    fi
    
    return $issues
}

# Main command handler
case "${1:-}" in
    start-all)
        start_all_servers
        ;;
    stop-all)
        stop_all_servers
        ;;
    restart-all)
        restart_all_servers
        ;;
    status-all)
        show_all_status
        print_separator
        health_check
        ;;
    cleanup)
        cleanup_processes
        ;;
    health)
        health_check
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac