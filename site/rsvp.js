// RSVP validation + submission (same format as the first invite, so the same Google Sheet
// and Apps Script take it: one row per guest with name, events, message, invite link and phone;
// the phone column needs tools/rsvp-apps-script.gs deployed, see README).
export const MESSAGE_LIMIT = 500;

// 10 to 15 digits, optionally starting with +; spaces, dashes, dots and brackets are fine
export const cleanPhone = (phone) => phone.trim().replace(/[\s\-().]/g, '');
const PHONE = /^\+?\d{10,15}$/;

export function validateRsvp({ name = '', phone = '', message = '', events = [] }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Please tell us your name';
  if (!PHONE.test(cleanPhone(phone))) errors.phone = 'Please enter a valid phone number';
  if (!events.length) errors.events = 'Tap at least one celebration';
  if (message.length > MESSAGE_LIMIT) errors.message = `Please keep it under ${MESSAGE_LIMIT} characters`;
  return errors;
}

// data: { name, phone, message, events, invited, invite, website }
//   events:  titles of the events the guest will attend
//   invited: titles of every event on this guest's invite
//   invite:  the guest-list link it came from (?invite=…)
//   website: hidden anti-bot field (left empty by people)
export async function submitRsvp(data, endpoint) {
  const entry = { ...data, name: data.name.trim(), phone: cleanPhone(data.phone), message: data.message.trim(), at: new Date().toISOString() };
  if (endpoint) {
    // text/plain keeps this a "simple" request: Apps Script can't answer CORS preflights
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(`RSVP failed (${res.status})`);
    const reply = await res.json().catch(() => ({ ok: false, error: 'unreadable reply' }));
    if (!reply.ok) throw new Error(`RSVP not saved: ${reply.error}`);
    return entry;
  }
  // No sheet connected: keep a local copy so nothing typed is lost, and log it.
  try {
    const saved = JSON.parse(localStorage.getItem('rsvp-entries') || '[]');
    saved.push(entry);
    localStorage.setItem('rsvp-entries', JSON.stringify(saved));
  } catch {}
  console.info('[rsvp]', entry);
  await new Promise((r) => setTimeout(r, 700));
  return entry;
}
