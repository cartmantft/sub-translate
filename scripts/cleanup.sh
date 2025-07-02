#!/bin/bash

# Process Cleanup Script
# Usage: ./scripts/cleanup.sh [--force] [--logs-only]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
PID_FILE="$LOG_DIR/server-pids.json"
LOG_FILE="$LOG_DIR/cleanup-$(date +%Y%m%d).log"

FORCE_MODE=false
LOGS_ONLY=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_MODE=true
            shift
            ;;
        --logs-only)
            LOGS_ONLY=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--force] [--logs-only]"
            echo ""
            echo "Options:"
            echo "  --force      Force kill all processes without confirmation"
            echo "  --logs-only  Only clean logs, don't touch processes"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(grep -v '^#' "$PROJECT_ROOT/.env.local" | xargs)
fi

LOG_RETENTION_DAYS=${LOG_RETENTION_DAYS:-7}

# Utility functions
log_message() {
    local level=$1
    local message=$2
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $message" | tee -a "$LOG_FILE"
}

print_header() {
    local title=$1
    echo ""
    echo "🧹 $title"
    echo "$(printf '%*s' ${#title} '' | tr ' ' '=')"
}

confirm_action() {
    local message=$1
    if [ "$FORCE_MODE" = true ]; then
        return 0
    fi
    
    echo -n "$message (y/N): "
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

cleanup_processes() {
    if [ "$LOGS_ONLY" = true ]; then
        return 0
    fi
    
    print_header "Process Cleanup"
    
    log_message "INFO" "Starting process cleanup..."
    
    # Find and kill Next.js development server processes
    echo "🔍 Searching for Next.js processes..."
    local next_pids=$(pgrep -f "next dev\|next-server" 2>/dev/null || true)
    
    if [ -n "$next_pids" ]; then
        echo "Found Next.js processes: $next_pids"
        if confirm_action "Kill Next.js development server processes?"; then
            echo "$next_pids" | xargs -r kill 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            local remaining=$(echo "$next_pids" | xargs -r -I {} sh -c 'kill -0 {} 2>/dev/null && echo {}' || true)
            if [ -n "$remaining" ]; then
                echo "Force killing remaining processes: $remaining"
                echo "$remaining" | xargs -r kill -9 2>/dev/null || true
            fi
            
            log_message "INFO" "Next.js processes cleaned up"
            echo "✅ Next.js processes cleaned"
        fi
    else
        echo "✅ No Next.js processes found"
    fi
    
    # Find and kill Playwright report server processes
    echo "🔍 Searching for Playwright report processes..."
    local playwright_pids=$(pgrep -f "playwright.*show-report" 2>/dev/null || true)
    
    if [ -n "$playwright_pids" ]; then
        echo "Found Playwright report processes: $playwright_pids"
        if confirm_action "Kill Playwright report server processes?"; then
            echo "$playwright_pids" | xargs -r kill 2>/dev/null || true
            sleep 1
            
            # Force kill if still running
            local remaining=$(echo "$playwright_pids" | xargs -r -I {} sh -c 'kill -0 {} 2>/dev/null && echo {}' || true)
            if [ -n "$remaining" ]; then
                echo "Force killing remaining processes: $remaining"
                echo "$remaining" | xargs -r kill -9 2>/dev/null || true
            fi
            
            log_message "INFO" "Playwright processes cleaned up"
            echo "✅ Playwright processes cleaned"
        fi
    else
        echo "✅ No Playwright report processes found"
    fi
    
    # Find and kill any npm processes in our project
    echo "🔍 Searching for project npm processes..."
    local npm_pids=$(pgrep -f "npm.*$PROJECT_ROOT" 2>/dev/null || true)
    
    if [ -n "$npm_pids" ]; then
        echo "Found project npm processes: $npm_pids"
        if confirm_action "Kill project npm processes?"; then
            echo "$npm_pids" | xargs -r kill 2>/dev/null || true
            log_message "INFO" "Project npm processes cleaned up"
            echo "✅ Project npm processes cleaned"
        fi
    else
        echo "✅ No project npm processes found"
    fi
    
    # Clean up orphaned node processes (more careful approach)
    echo "🔍 Searching for orphaned node processes in project..."
    local node_pids=$(ps aux | grep -E "node.*$PROJECT_ROOT" | grep -v grep | awk '{print $2}' || true)
    
    if [ -n "$node_pids" ]; then
        echo "Found project node processes: $node_pids"
        if confirm_action "Kill project node processes?"; then
            echo "$node_pids" | xargs -r kill 2>/dev/null || true
            log_message "INFO" "Project node processes cleaned up"
            echo "✅ Project node processes cleaned"
        fi
    else
        echo "✅ No orphaned project node processes found"
    fi
}

cleanup_pid_files() {
    if [ "$LOGS_ONLY" = true ]; then
        return 0
    fi
    
    print_header "PID File Cleanup"
    
    if [ -f "$PID_FILE" ]; then
        echo "🗑️  Removing stale PID file: $PID_FILE"
        
        # Backup PID file before removal
        local backup_file="$PID_FILE.backup.$(date +%Y%m%d-%H%M%S)"
        cp "$PID_FILE" "$backup_file" 2>/dev/null || true
        
        rm -f "$PID_FILE"
        log_message "INFO" "PID file removed (backup: $backup_file)"
        echo "✅ PID file cleaned (backup created)"
    else
        echo "✅ No PID file to clean"
    fi
}

cleanup_logs() {
    print_header "Log Cleanup"
    
    echo "🗑️  Cleaning logs older than $LOG_RETENTION_DAYS days..."
    
    local cleaned_count=0
    
    if [ -d "$LOG_DIR" ]; then
        # Clean old log files
        while IFS= read -r -d '' file; do
            if [ -f "$file" ]; then
                echo "Removing old log: $(basename "$file")"
                rm -f "$file"
                cleaned_count=$((cleaned_count + 1))
            fi
        done < <(find "$LOG_DIR" -name "*.log" -mtime +$LOG_RETENTION_DAYS -print0 2>/dev/null || true)
        
        # Clean old backup PID files
        while IFS= read -r -d '' file; do
            if [ -f "$file" ]; then
                echo "Removing old PID backup: $(basename "$file")"
                rm -f "$file"
                cleaned_count=$((cleaned_count + 1))
            fi
        done < <(find "$LOG_DIR" -name "*.backup.*" -mtime +$LOG_RETENTION_DAYS -print0 2>/dev/null || true)
    fi
    
    log_message "INFO" "Cleaned $cleaned_count old log files"
    echo "✅ Cleaned $cleaned_count old log files"
}

cleanup_test_artifacts() {
    print_header "Test Artifacts Cleanup"
    
    local test_results_dir="$PROJECT_ROOT/test-results"
    local playwright_report_dir="$PROJECT_ROOT/playwright-report"
    
    # Clean old test results
    if [ -d "$test_results_dir" ]; then
        echo "🗑️  Cleaning old test results..."
        find "$test_results_dir" -type d -mtime +$LOG_RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
        echo "✅ Test results cleaned"
    fi
    
    # Clean old playwright reports (but keep the latest)
    if [ -d "$playwright_report_dir" ]; then
        echo "🗑️  Cleaning old playwright reports..."
        find "$playwright_report_dir" -name "*.html" -mtime +3 -delete 2>/dev/null || true
        find "$playwright_report_dir/data" -name "*.md" -mtime +3 -delete 2>/dev/null || true
        echo "✅ Old playwright reports cleaned"
    fi
    
    log_message "INFO" "Test artifacts cleanup completed"
}

show_cleanup_summary() {
    print_header "Cleanup Summary"
    
    echo "📊 Current status:"
    
    # Check for remaining processes
    local next_count=$(pgrep -f "next dev\|next-server" 2>/dev/null | wc -l || echo "0")
    local playwright_count=$(pgrep -f "playwright.*show-report" 2>/dev/null | wc -l || echo "0")
    
    echo "Next.js processes: $next_count"
    echo "Playwright processes: $playwright_count"
    
    # Check PID file
    if [ -f "$PID_FILE" ]; then
        echo "PID file: ❌ Still exists"
    else
        echo "PID file: ✅ Cleaned"
    fi
    
    # Check log directory size
    if [ -d "$LOG_DIR" ]; then
        local log_size=$(du -sh "$LOG_DIR" 2>/dev/null | cut -f1 || echo "unknown")
        echo "Log directory size: $log_size"
    fi
    
    log_message "INFO" "Cleanup summary completed"
}

# Main execution
main() {
    log_message "INFO" "Starting cleanup process (force: $FORCE_MODE, logs-only: $LOGS_ONLY)"
    
    if [ "$LOGS_ONLY" = false ]; then
        echo "🚨 This will clean up server processes and files"
        if [ "$FORCE_MODE" = false ]; then
            echo "⚠️  Make sure to save your work before proceeding"
            echo ""
        fi
    fi
    
    cleanup_processes
    cleanup_pid_files
    cleanup_logs
    cleanup_test_artifacts
    show_cleanup_summary
    
    log_message "INFO" "Cleanup process completed"
    echo ""
    echo "🎉 Cleanup completed successfully!"
    echo "📋 Check log file: $LOG_FILE"
}

# Run main function
main "$@"