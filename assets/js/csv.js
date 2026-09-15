/* =============================================================================
   csv.js — RFC 4180 CSV parser.
   Google Forms answers routinely contain commas, line breaks and quotation
   marks (free-text boxes especially), so splitting on "," is not an option.
   This walks the string character by character and handles quoted fields,
   escaped quotes (""), and CRLF / LF / CR line endings.
   ========================================================================== */

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false, i = 0;

  /* Strip a UTF-8 byte order mark — Sheets exports often carry one, and it
     would otherwise become part of the first column header. */
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  while (i < text.length) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }  // escaped quote
        inQuotes = false; i++; continue;
      }
      field += ch; i++; continue;
    }

    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(field); field = ''; i++; continue; }
    if (ch === '\r' || ch === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
      i += (ch === '\r' && text[i + 1] === '\n') ? 2 : 1;
      continue;
    }
    field += ch; i++;
  }
  /* Flush whatever is still buffered when the string ends. */
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  /* Drop trailing blank lines, which every spreadsheet export seems to add. */
  while (rows.length && rows[rows.length - 1].every(c => c.trim() === '')) rows.pop();
  return rows;
}

/* Turn a CSV string into { headers, records } where each record is an object
   keyed by the header text. Duplicate headers get a numeric suffix so no
   column is silently swallowed. */
function parseCsvToObjects(text) {
  const rows = parseCsv(text);
  if (!rows.length) return { headers: [], records: [] };

  const seen = new Map();
  const headers = rows[0].map(h => {
    const name = h.trim();
    const count = seen.get(name) || 0;
    seen.set(name, count + 1);
    return count === 0 ? name : `${name} (${count + 1})`;
  });

  const records = rows.slice(1)
    .filter(r => r.some(cell => cell.trim() !== ''))
    .map(r => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim(); });
      return obj;
    });

  return { headers, records };
}

/* Serialise back to CSV — used by the "download summary" buttons. */
function toCsv(rows) {
  const esc = v => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map(r => r.map(esc).join(',')).join('\r\n');
}

if (typeof module !== 'undefined' && module.exports) module.exports = { parseCsv, parseCsvToObjects, toCsv };
if (typeof window !== 'undefined') Object.assign(window, { parseCsv, parseCsvToObjects, toCsv });
