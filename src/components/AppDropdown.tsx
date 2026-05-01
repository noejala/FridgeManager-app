import { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import './AppDropdown.css';

interface Option {
  value: string;
  label: string;
}

interface AppDropdownProps {
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function AppDropdown({ value, options, onChange, placeholder, id, className }: AppDropdownProps) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const current = options.find(o => o.value === value);

  useEffect(() => {
    if (open && menuRef.current) {
      const active = menuRef.current.querySelector('.app-dropdown-item.active') as HTMLElement | null;
      active?.scrollIntoView({ block: 'nearest' });
    }
  }, [open]);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelWidth = Math.max(rect.width, 170);
      const panelHeight = Math.min((options.length + (placeholder ? 1 : 0)) * 38 + 16, 220);
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 8) left = rect.right - panelWidth;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow >= panelHeight || spaceBelow >= rect.top
        ? rect.bottom + 4
        : rect.top - panelHeight - 4;
      setPanelStyle({ top, left: Math.max(8, left), width: panelWidth });
    }
    setOpen(o => !o);
  };

  return (
    <div className={`app-dropdown${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`app-dropdown-btn${open ? ' app-dropdown-btn--open' : ''}`}
        onClick={handleOpen}
      >
        <span className={`app-dropdown-value${!current ? ' app-dropdown-value--placeholder' : ''}`}>
          {current?.label ?? placeholder ?? ''}
        </span>
        <svg className="app-dropdown-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="2,4 6,8 10,4" />
        </svg>
      </button>
      {open && createPortal(
        <>
          <div className="app-dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="app-dropdown-menu" ref={menuRef} style={{ position: 'fixed', zIndex: 500, ...panelStyle }}>
            {placeholder && (
              <button
                type="button"
                className={`app-dropdown-item${value === '' ? ' active' : ''}`}
                onClick={() => { onChange(''); setOpen(false); }}
              >
                {placeholder}
              </button>
            )}
            {options.map(o => (
              <button
                type="button"
                key={o.value}
                className={`app-dropdown-item${value === o.value ? ' active' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
