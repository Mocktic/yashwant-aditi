// Google Apps Script for the wedding invite RSVPs.
// Paste into your Google Sheet: Extensions → Apps Script, then Deploy → Web app
// (Execute as: Me · Who has access: Anyone). See README → "RSVPs into Google Sheets".
//
// Creates two tabs on the first RSVP — leave the sheet empty, don't type headers yourself:
//   RSVPs   — one row per guest: Submitted at · Name · Events attending · Message · Invite link · Phone
//             (Phone was added last so rows from before it stay lined up; an existing sheet
//              gets the new header cell on the next RSVP)
//   Summary — every event with a live count of guests attending it
// The script only ever adds rows; it never sends sheet data back to anyone.

const RSVP_SHEET = 'RSVPs';
const SUMMARY_SHEET = 'Summary';
const HEADERS = ['Submitted at', 'Name', 'Events attending', 'Message', 'Invite link', 'Phone'];
const SEPARATOR = ' | '; // event names contain commas, so they are joined with a bar
const MAX_PER_MINUTE = 30; // a crude brake on junk submissions

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // two guests sending at the same moment won't clash
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (data.website) return json({ ok: true }); // hidden field that only bots fill in
    if (tooMany()) return json({ ok: false, error: 'busy' });

    const name = clean(data.name, 80);
    const invited = list(data.invited); // events shown on this guest's invite
    const events = list(data.events).filter((t) => invited.length === 0 || invited.indexOf(t) !== -1);
    if (name.length < 2) return json({ ok: false, error: 'name' });
    if (events.length === 0) return json({ ok: false, error: 'events' });

    getSheet(RSVP_SHEET, HEADERS).appendRow([
      new Date(),
      safe(name),
      safe(events.join(SEPARATOR)),
      safe(clean(data.message, 500)),
      safe(clean(data.invite, 40) || 'default'),
      phoneText(data.phone),
    ]);
    addToSummary(invited.length ? invited : events);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

// Summary tab: one row per event with a live COUNTIF over the "Events attending" column.
function addToSummary(titles) {
  const sheet = getSheet(SUMMARY_SHEET, ['Event', 'Guests attending']);
  const last = sheet.getLastRow();
  const existing = last > 1 ? sheet.getRange(2, 1, last - 1, 1).getValues().map((r) => r[0]) : [];
  titles.forEach((title) => {
    if (existing.indexOf(title) !== -1) return;
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1).setValue(safe(title));
    sheet.getRange(row, 2).setFormula('=COUNTIF(' + RSVP_SHEET + '!C:C,"*"&A' + row + '&"*")');
    existing.push(title);
  });
}

function getSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastColumn() < headers.length) {
    // a sheet made before a column was added: add the missing header cells
    const from = sheet.getLastColumn() + 1;
    sheet.getRange(1, from, 1, headers.length - from + 1).setValues([headers.slice(from - 1)]).setFontWeight('bold');
  }
  return sheet;
}

function tooMany() {
  const cache = CacheService.getScriptCache();
  const count = Number(cache.get('rsvp-count') || 0) + 1;
  cache.put('rsvp-count', String(count), 60);
  return count > MAX_PER_MINUTE;
}

// Stored as text (the ' prefix) so a leading 0 or + survives and Sheets doesn't treat it as a number
const phoneText = (value) => { const p = clean(value, 20).replace(/[^\d+]/g, ''); return p ? "'" + p : ''; };
const clean = (value, max) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, max);
const list = (value) => (Array.isArray(value) ? value.map((v) => clean(v, 80)).filter(Boolean) : []);
// Text starting with = + - @ would run as a spreadsheet formula; store it as plain text instead.
const safe = (text) => (/^[=+\-@]/.test(text) ? "'" + text : text);

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
