'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownItem[];
  disabled?: boolean;
  className?: string;
  position?: 'left' | 'right' | 'center';
  size?: 'sm' | 'md' | 'lg';
}

export default function DropdownMenu({ 
  trigger, 
  items, 
  disabled = false, 
  className = '', 
  position = 'right', 
  size = 'md' 
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (!item.disabled) {
      item.onClick();
      setIsOpen(false);
    }
  };

  // Position classes for dropdown with overflow handling
  const getPositionClasses = () => {
    const baseClasses = 'transform-gpu';
    switch (position) {
      case 'left':
        return `${baseClasses} left-0 origin-top-left`;
      case 'center':
        return `${baseClasses} left-1/2 -translate-x-1/2 origin-top`;
      case 'right':
      default:
        return `${baseClasses} right-0 origin-top-right`;
    }
  };

  // Size classes for dropdown
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'min-w-[120px]';
      case 'lg':
        return 'min-w-[200px]';
      case 'md':
      default:
        return 'min-w-[160px]';
    }
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="inline-flex items-center justify-center"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {trigger}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className={`absolute ${getPositionClasses()} top-full mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg ${getSizeClasses()} max-h-96 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-100`}>
          <div className="py-1">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}