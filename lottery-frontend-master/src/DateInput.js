import { useEffect, useRef, useState } from 'react';

function formatDate(value) {
  return value ? value.split('-').reverse().join('/') : '';
}

function parseDate(value) {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  return date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day) ? `${year}-${month}-${day}` : null;
}

export default function DateInput({ value, onChange, min, max, id, disabled = false }) {
  const [text, setText] = useState(formatDate(value));
  const nativePicker = useRef(null);
  useEffect(() => setText(formatDate(value)), [value]);

  function commit() {
    const next = parseDate(text);
    if (next && (!min || next >= min) && (!max || next <= max)) onChange(next);
    else setText(formatDate(value));
  }

  function openPicker() {
    if (nativePicker.current?.showPicker) nativePicker.current.showPicker();
    else nativePicker.current?.focus();
  }

  return <span className="date-control"><input id={id} type="text" inputMode="numeric" placeholder="dd/mm/yyyy" value={text} disabled={disabled} onChange={(event) => setText(event.target.value)} onBlur={commit} onKeyDown={(event) => { if (event.key === 'Enter') commit(); }} /><button type="button" className="date-picker-button" aria-label="Chọn ngày" disabled={disabled} onClick={openPicker}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v3m10-3v3M4 9h16M5 5h14v15H5z" /></svg></button><input ref={nativePicker} className="date-picker-native" type="date" value={value || ''} min={min} max={max} onChange={(event) => onChange(event.target.value)} tabIndex="-1" aria-hidden="true" /></span>;
}
