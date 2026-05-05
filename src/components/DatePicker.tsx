import { useState, useRef, useEffect, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import './DatePicker.css';

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const DAYS_SHORT = ['L','M','M','J','V','S','D'];

const MONTHS_SELECT = [
  'Jan','Fév','Mar','Avr','Mai','Juin','Juil','Août','Sep','Oct','Nov','Déc',
];

interface DatePickerProps {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  id?: string;
  className?: string;
  alwaysCalendar?: boolean;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDisplay(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function todayStr() {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth() + 1, t.getDate());
}

let _dpId = 0;

export function DatePicker({ value, onChange, min, max, placeholder = 'JJ/MM/AAAA', id, className, alwaysCalendar = false }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const uid = useRef(`dp-${++_dpId}`);
  const today = todayStr();

  useEffect(() => {
    const close = (e: Event) => {
      if ((e as CustomEvent).detail?.uid !== uid.current) setOpen(false);
    };
    window.addEventListener('app-dropdown-open', close);
    return () => window.removeEventListener('app-dropdown-open', close);
  }, []);

  const initView = () => {
    const base = value || today;
    return { y: parseInt(base.split('-')[0]), m: parseInt(base.split('-')[1]) };
  };
  const [viewYear, setViewYear] = useState(initView().y);
  const [viewMonth, setViewMonth] = useState(initView().m);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelWidth = 280;
      const panelHeight = 340;
      let left = rect.left;
      if (left + panelWidth > window.innerWidth - 8) left = rect.right - panelWidth;
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      let top: number;
      let maxHeight: number | undefined;
      if (spaceBelow >= panelHeight) {
        top = rect.bottom + 4;
      } else if (spaceAbove >= spaceBelow) {
        top = Math.max(8, rect.top - panelHeight - 4);
        maxHeight = spaceAbove;
      } else {
        top = rect.bottom + 4;
        maxHeight = spaceBelow;
      }
      setPanelStyle({ top, left: Math.max(8, left), ...(maxHeight ? { maxHeight, overflowY: 'auto' } : {}) });
    }
    const base = value || today;
    setViewYear(parseInt(base.split('-')[0]));
    setViewMonth(parseInt(base.split('-')[1]));
    window.dispatchEvent(new CustomEvent('app-dropdown-open', { detail: { uid: uid.current } }));
    setOpen(true);
  };

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isDisabled = (ds: string) => (min && ds < min) || (max && ds > max) || false;

  const isMobile = !alwaysCalendar && window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    const parts = value ? value.split('-') : ['', '', ''];
    const selDay = parts[2] ? String(parseInt(parts[2])) : '';
    const selMonth = parts[1] ? String(parseInt(parts[1])) : '';
    const selYear = parts[0] || '';

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
    const daysCount = (selYear && selMonth)
      ? new Date(parseInt(selYear), parseInt(selMonth), 0).getDate()
      : 31;
    const days = Array.from({ length: daysCount }, (_, i) => i + 1);

    const emit = (d: string, m: string, y: string) => {
      if (d && m && y) {
        onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      }
    };

    return (
      <div className={`date-picker date-picker--mobile${className ? ` ${className}` : ''}`} id={id}>
        <select
          className="dp-select"
          value={selDay}
          onChange={e => emit(e.target.value, selMonth, selYear)}
        >
          <option value="" disabled>J</option>
          {days.map(d => <option key={d} value={String(d)}>{d}</option>)}
        </select>
        <select
          className="dp-select"
          value={selMonth}
          onChange={e => emit(selDay, e.target.value, selYear)}
        >
          <option value="" disabled>M</option>
          {MONTHS_SELECT.map((name, i) => (
            <option key={i + 1} value={String(i + 1)}>{name}</option>
          ))}
        </select>
        <select
          className="dp-select"
          value={selYear}
          onChange={e => emit(selDay, selMonth, e.target.value)}
        >
          <option value="" disabled>A</option>
          {years.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
      </div>
    );
  }

  // Build calendar cells
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDow = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7;
  const prevM = viewMonth === 1 ? 12 : viewMonth - 1;
  const prevY = viewMonth === 1 ? viewYear - 1 : viewYear;
  const nextM = viewMonth === 12 ? 1 : viewMonth + 1;
  const nextY = viewMonth === 12 ? viewYear + 1 : viewYear;
  const prevDays = new Date(viewYear, viewMonth - 1, 0).getDate();

  type Cell = { day: number; month: number; year: number; outside: boolean };
  const cells: Cell[] = [];
  for (let i = firstDow - 1; i >= 0; i--)
    cells.push({ day: prevDays - i, month: prevM, year: prevY, outside: true });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, month: viewMonth, year: viewYear, outside: false });
  const fill = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= fill; d++)
    cells.push({ day: d, month: nextM, year: nextY, outside: true });

  const handleSelect = (c: Cell) => {
    const ds = toDateStr(c.year, c.month, c.day);
    if (isDisabled(ds)) return;
    onChange(ds);
    setOpen(false);
  };

  const todayDisabled = isDisabled(today);

  return (
    <div className={`date-picker${className ? ` ${className}` : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        className={`app-dropdown-btn${open ? ' app-dropdown-btn--open' : ''}`}
        onClick={handleOpen}
      >
        <span className={`app-dropdown-value${!value ? ' app-dropdown-value--placeholder' : ''}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg className="dp-cal-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && createPortal(
        <>
          <div className="app-dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="dp-panel" style={{ position: 'fixed', zIndex: 511, ...panelStyle }}>
            <div className="dp-header">
              <button type="button" className="dp-nav-btn" onClick={prevMonth}>‹</button>
              <span className="dp-month-label">{MONTHS_FR[viewMonth - 1]} {viewYear}</span>
              <button type="button" className="dp-nav-btn" onClick={nextMonth}>›</button>
            </div>
            <div className="dp-dow-row">
              {DAYS_SHORT.map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div className="dp-grid">
              {cells.map((c, i) => {
                const ds = toDateStr(c.year, c.month, c.day);
                return (
                  <button
                    key={i}
                    type="button"
                    className={[
                      'dp-day',
                      c.outside      ? 'dp-day--outside'  : '',
                      ds === value   ? 'dp-day--selected' : '',
                      ds === today   ? 'dp-day--today'    : '',
                      isDisabled(ds) ? 'dp-day--disabled' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => handleSelect(c)}
                    disabled={!!isDisabled(ds)}
                  >
                    {c.day}
                  </button>
                );
              })}
            </div>
            <div className="dp-footer">
              {value && (
                <button type="button" className="dp-footer-btn" onClick={() => { onChange(''); setOpen(false); }}>
                  Effacer
                </button>
              )}
              <button
                type="button"
                className="dp-footer-btn dp-footer-btn--accent"
                onClick={() => { if (!todayDisabled) { onChange(today); setOpen(false); } }}
                disabled={todayDisabled}
              >
                Aujourd'hui
              </button>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
