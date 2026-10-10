import React, { useEffect, useRef, useState } from 'react';

/**
 * Modern, accessible, animated Dropdown component.
 * Supports strings, numbers, or objects: { value, label, icon, badge, subtitle, disabled }
 */
export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option…',
  label,
  icon,
  variant = 'form', // 'topbar' | 'form' | 'compact' | 'accent'
  disabled = false,
  className = '',
  style = {},
  menuWidth,
  id,
  'aria-label': ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  // Normalize options to objects: { value, label, icon, badge, subtitle, disabled }
  const normalizedOptions = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value !== undefined ? opt.value : opt.id,
          label: opt.label !== undefined ? opt.label : opt.name,
          icon: opt.icon,
          badge: opt.badge,
          subtitle: opt.subtitle,
          disabled: Boolean(opt.disabled)
        };
      }
      return {
        value: opt,
        label: String(opt),
        disabled: false
      };
    });
  }, [options]);

  const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  function handleKeyDown(e) {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        const target = normalizedOptions[highlightedIndex];
        if (!target.disabled) {
          onChange?.(target.value);
          setIsOpen(false);
        }
      } else {
        setIsOpen(prev => !prev);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex(prev => {
          const next = prev + 1;
          return next < normalizedOptions.length ? next : 0;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(normalizedOptions.length - 1);
      } else {
        setHighlightedIndex(prev => {
          const next = prev - 1;
          return next >= 0 ? next : normalizedOptions.length - 1;
        });
      }
    } else if (e.key === 'Tab') {
      if (isOpen) setIsOpen(false);
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && menuRef.current && highlightedIndex >= 0) {
      const items = menuRef.current.querySelectorAll('.custom-dropdown-item');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  function handleSelect(option) {
    if (option.disabled) return;
    onChange?.(option.value);
    setIsOpen(false);
  }

  return (
    <div
      ref={dropdownRef}
      className={`custom-dropdown-container custom-dropdown-${variant} ${isOpen ? 'dropdown-is-open' : ''} ${disabled ? 'dropdown-disabled' : ''} ${className}`}
      style={style}
      id={id}
    >
      {label && <span className="custom-dropdown-label">{label}</span>}

      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || 'Select'}
        disabled={disabled}
      >
        <div className="custom-dropdown-trigger-content">
          {(icon || selectedOption?.icon) && (
            <span className="custom-dropdown-trigger-icon">
              {selectedOption?.icon || icon}
            </span>
          )}
          <span className={`custom-dropdown-value ${!selectedOption ? 'custom-dropdown-placeholder' : ''}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="custom-dropdown-badge">{selectedOption.badge}</span>
          )}
        </div>

        <svg
          className="custom-dropdown-chevron"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 8 10 12 14 8" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="custom-dropdown-menu"
          role="listbox"
          style={menuWidth ? { width: menuWidth, minWidth: menuWidth } : {}}
        >
          <div className="custom-dropdown-list">
            {normalizedOptions.length === 0 ? (
              <div className="custom-dropdown-empty">No options available</div>
            ) : (
              normalizedOptions.map((opt, index) => {
                const isSelected = String(opt.value) === String(value);
                const isHighlighted = highlightedIndex === index;

                return (
                  <div
                    key={`${opt.value}-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`custom-dropdown-item ${isSelected ? 'item-selected' : ''} ${isHighlighted ? 'item-highlighted' : ''} ${opt.disabled ? 'item-disabled' : ''}`}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="custom-dropdown-item-body">
                      {opt.icon && <span className="custom-dropdown-item-icon">{opt.icon}</span>}
                      <div className="custom-dropdown-item-text">
                        <span className="custom-dropdown-item-label">{opt.label}</span>
                        {opt.subtitle && (
                          <span className="custom-dropdown-item-subtitle">{opt.subtitle}</span>
                        )}
                      </div>
                      {opt.badge && (
                        <span className="custom-dropdown-item-badge">{opt.badge}</span>
                      )}
                    </div>

                    {isSelected && (
                      <svg
                        className="custom-dropdown-check"
                        width="16"
                        height="16"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
