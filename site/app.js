import config from './config.js';
import { validateRsvp, submitRsvp } from './rsvp.js';
import { createAlphaVideo } from './alpha-video.js';

const app = document.getElementById('app');
const music = document.getElementById('music');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- which guest list this link is for ----------
const params = new URLSearchParams(location.search);
const inviteName = config.invites[params.get('invite')] ? params.get('invite') : config.defaultInvite;
const invite = config.invites[inviteName];
const events = invite.events.map((id) => ({ id, ...config.events[id] }));
const saveDates = invite.save.map((id) => config.events[id].date);
const manifest = await fetch('media/manifest.json').then((r) => r.json()).catch(() => ({ videos: [] }));

const [nameA, nameB] = config.couple;
let guest = load('guest-name') || '';

// ---------- formatting ----------
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
const ordinal = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
const shortDate = (iso) => { const d = toDate(iso); return `${ordinal(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
function fmtTime(hm) {
  const [h, m] = hm.split(':').map(Number);
  if (h === 0 && m === 0) return 'midnight';
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`;
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const firstName = () => esc(guest.trim().split(/\s+/)[0] || '');

// ---------- small drawings ----------
let heartId = 0;
function heart(cls = '') {
  const id = `rough${heartId++}`;
  return `<svg class="heart ${cls}" viewBox="0 0 220 200" role="img" aria-label="${nameA} and ${nameB}">
    <defs><filter id="${id}"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="5"/></filter></defs>
    <path filter="url(#${id})" d="M110 188 C 40 140, 6 100, 10 58 C 14 22, 52 6, 80 18 C 96 25, 106 38, 110 50 C 114 38, 124 25, 140 18 C 168 6, 206 22, 210 58 C 214 100, 180 140, 110 188 Z" fill="#E8283A" stroke="#fff" stroke-width="7" stroke-linejoin="round"/>
    <g transform="rotate(-12 110 95)" fill="#fff" font-family="'Caveat Brush', cursive" text-anchor="middle">
      <text x="110" y="88" font-size="35">${nameA} +</text>
      <text x="114" y="128" font-size="42">${nameB}</text>
    </g>
  </svg>`;
}
const squiggle = `<svg class="squiggle" viewBox="0 0 240 14" aria-hidden="true"><path d="M3 8 C 30 2, 50 13, 80 7 S 130 2, 160 8 S 210 12, 237 6" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`;
const heartsLine = `<svg class="hearts-line" viewBox="0 0 300 20" aria-hidden="true"><path d="M22 10 H 278" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M10 6 c-3-4-9-1-6 4 l6 6 6-6 c3-5-3-8-6-4z M290 6 c-3-4-9-1-6 4 l6 6 6-6 c3-5-3-8-6-4z" fill="currentColor"/></svg>`;
const pin = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="#6148F0"/></svg>`;
function sparkles(n = 5) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = 8 + Math.random() * 84, y = 6 + Math.random() * 46, s = 10 + Math.random() * 14, d = (Math.random() * 1.6).toFixed(2);
    out += `<svg class="sparkle" style="left:${x}%;top:${y}%;width:${s}px;animation-delay:${d}s" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill="currentColor"/></svg>`;
  }
  return out;
}

// The couple: the video where there is one (see tools/prepare_assets.py), otherwise the still
// with a little idle wiggle so the screen never feels frozen.
const IDLE = { intro: 'giggle', haldi: 'giggle', engagement: 'giggle', baraat: 'dance', wedding: 'bow', reception: 'sway', afterparty: 'dance', thanks: 'wave', finale: 'none' };
// With a video, the still stays underneath until the video is actually playing, so a slow
// connection shows the picture instead of an empty screen.
const alphaVideo = createAlphaVideo();
const hasVideo = (art) => alphaVideo !== null && manifest.videos.includes(art);
function couple(art, cls = '', { loop = true } = {}) {
  // the still only wiggles when it is the whole show; under a video it must match the video's first frame
  const still = hasVideo(art)
    ? `<img class="couple__still" src="media/couple/${art}.webp" alt="">`
    : `<img class="couple__media idle-${IDLE[art]}" src="media/couple/${art}.webp" alt="">`;
  // only the intro loads straight away; each later video starts loading a screen ahead (see go())
  const video = hasVideo(art)
    ? `<video class="couple__media" src="media/couple/${art}.mp4" muted playsinline ${loop ? 'loop' : ''} preload="${art === 'intro' ? 'auto' : 'none'}"></video>`
    : '';
  return `<div class="couple ${video ? 'couple--video' : ''} ${cls}"><div class="couple__pop">${still}${video}</div></div>`;
}

// ---------- screens ----------
function introScreen() {
  return {
    auto: true,
    duration: config.timing.intro,
    html: `<section class="scene scene--intro">
      ${sparkles(4)}
      <div class="intro__top">
        <p class="intro__hey anim a1">${firstName() ? `Hey ${firstName()}!` : 'Hey there!'}</p>
        ${heart('heart--big anim pop a2')}
        <p class="intro__line anim a3">are getting married!</p>
      </div>
      ${couple('intro', 'couple--bleed')}
    </section>`,
  };
}

function saveScreen() {
  const dates = saveDates.map(toDate);
  const d = dates[0];
  const daysLeft = Math.ceil((d - new Date()) / 864e5);
  const when = dates.length === 1
    ? `<p class="save__day">${String(d.getDate()).padStart(2, '0')}</p><p class="save__month">${MONTHS[d.getMonth()].toUpperCase()} &bull; ${d.getFullYear()}</p>`
    : `<p class="save__days">${dates.map((x) => `${String(x.getDate()).padStart(2, '0')} ${MONTHS[x.getMonth()].slice(0, 3).toUpperCase()}`).join(' <span>&amp;</span> ')}</p><p class="save__month">${d.getFullYear()}</p>`;
  const letters = (word, start) => [...word].map((c, i) => `<span style="--i:${start + i}">${c}</span>`).join('');
  return {
    auto: true,
    duration: config.timing.save,
    onEnter: () => setTimeout(() => burst(0.45), 900),
    html: `<section class="scene scene--save">
      <div class="stamp"><div class="stamp__inner">
        ${sparkles(5)}
        <h2 class="save__title" aria-label="Save the date">
          <span class="save__big">${letters('SAVE', 0)}</span>
          <span class="save__the">the</span>
          <span class="save__big">${letters('DATE', 4)}</span>
        </h2>
        <p class="save__names anim a3">${nameA} + ${nameB}</p>
        <div class="save__when anim pop a4">${when}</div>
        <div class="save__line anim a5">${heartsLine}</div>
        ${daysLeft > 0 ? `<p class="save__count anim pop a6">${daysLeft} days to go!</p>` : ''}
      </div></div>
    </section>`,
  };
}

function eventScreen(e) {
  const d = toDate(e.date);
  return {
    auto: true,
    duration: config.timing.event,
    html: `<section class="scene scene--event">
      <img class="deco" src="media/deco/${e.deco}.webp" alt="">
      ${sparkles(3)}
      <div class="event__top">
        ${heart('heart--small anim pop a1')}
        <h2 class="event__title write a2">${esc(e.label)}</h2>
        ${e.sub ? `<p class="event__sub anim a3">${esc(e.sub)}</p>` : ''}
        <p class="event__when anim a3">${DAYS[d.getDay()]}, ${shortDate(e.date)} &middot; ${fmtTime(e.start)}</p>
        <div class="event__line draw a4">${squiggle}</div>
        <p class="event__venue anim a4">${esc(e.venue)}</p>
        <p class="event__city anim a5">${esc(e.city)}</p>
        ${e.map ? `<a class="map-pill anim pop a6 no-tap" href="${e.map}" target="_blank" rel="noopener">${pin}Directions</a>` : ''}
      </div>
      ${couple(e.art)}
    </section>`,
  };
}

// The lift and spin. As a video it fills the screen (the camera rises and rushes into their
// faces) and plays once; as a still, CSS zooms into their faces instead.
function finaleScreen() {
  const video = hasVideo('finale');
  return {
    auto: true,
    duration: video ? Math.round(manifest.durations.finale * 1000) + 300 : config.timing.finale,
    html: `<section class="scene scene--finale">
      ${video ? '' : '<img class="deco" src="media/deco/reception.webp" alt="">'}
      ${couple('finale', video ? 'couple--full' : 'couple--center', { loop: false })}
      ${video ? '<img class="deco deco--fadeout" src="media/deco/reception.webp" alt="">' : ''}
    </section>`,
  };
}

function rsvpScreen() {
  const cards = events.map((e) => `
    <button type="button" class="card" data-title="${esc(e.title)}" aria-pressed="${events.length === 1}">
      <span class="card__art"><img src="media/couple/${e.art}.webp" alt=""></span>
      <span class="card__label">${esc(e.label)}</span>
      <span class="card__date">${DAYS[toDate(e.date).getDay()]}, ${shortDate(e.date)}</span>
      <span class="card__tick" aria-hidden="true">&#10003;</span>
    </button>`).join('');
  return {
    auto: false,
    html: `<section class="scene scene--rsvp">
      <img class="deco deco--soft" src="media/deco/rsvp.webp" alt="">
      <div class="rsvp__scroll">
        ${heart('heart--rsvp anim pop a1')}
        <h2 class="rsvp__title anim a2">RSVP <span>now!</span></h2>
        <form class="rsvp__form anim a3" novalidate>
          <label class="field">
            <span class="field__label">Your name</span>
            <input name="name" autocomplete="name" maxlength="80" required value="${esc(guest)}" placeholder="Type your name">
            <span class="field__error" data-for="name"></span>
          </label>
          <label class="field">
            <span class="field__label">Phone number</span>
            <input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required value="${esc(load('guest-phone') || '')}" placeholder="+91 98765 43210">
            <span class="field__error" data-for="phone"></span>
          </label>
          <fieldset class="field">
            <legend class="field__label">${events.length > 1 ? 'Which celebrations will you join?' : 'Will you join us?'}</legend>
            <div class="cards ${events.length === 1 ? 'cards--one' : ''}">${cards}</div>
            <span class="field__error" data-for="events"></span>
          </fieldset>
          <label class="field">
            <span class="field__label">A note for ${nameA} &amp; ${nameB} <em>(optional)</em></span>
            <textarea name="message" rows="3" maxlength="500" placeholder="Wishes, blessings, dance requests…"></textarea>
            <span class="field__error" data-for="message"></span>
          </label>
          <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <button class="btn btn--send" type="submit">Send RSVP</button>
          <p class="rsvp__status" role="status"></p>
        </form>
        <button type="button" class="link-btn replay">&#8634; Watch the invite again</button>
      </div>
    </section>`,
  };
}

function thanksScreen() {
  return {
    auto: false,
    html: `<section class="scene scene--thanks">
      <img class="deco" src="media/deco/engagement.webp" alt="">
      ${sparkles(5)}
      <div class="thanks__top">
        ${heart('heart--small anim pop a1')}
        <h2 class="thanks__title anim pop a2">Thank you<span class="thanks__name"></span>!</h2>
        <p class="thanks__line anim a3">Your RSVP is in. We can't wait to celebrate with you!</p>
        <p class="thanks__see anim a4"></p>
        <button type="button" class="link-btn replay anim a5">&#8634; Watch the invite again</button>
      </div>
      ${couple('thanks')}
    </section>`,
  };
}

function gateScreen() {
  return `<section class="gate is-active">
    <div class="stamp"><div class="stamp__inner">
      ${sparkles(6)}
      ${heart('heart--gate')}
      <p class="gate__kicker">You're invited!</p>
      <form class="gate__form">
        <label for="guest" class="gate__label">Your name</label>
        <input id="guest" name="guest" autocomplete="name" maxlength="80" placeholder="Type your name" value="${esc(guest)}">
        <button class="btn" type="submit">Open Invitation</button>
      </form>
      <p class="gate__hint">&#9835; Best with sound on</p>
    </div></div>
  </section>`;
}

// ---------- assemble ----------
const screens = [introScreen(), saveScreen(), ...events.map(eventScreen)];
if (invite.events.includes('reception')) screens.push(finaleScreen());
screens.push(rsvpScreen());
const thanks = thanksScreen();
screens.push(thanks);
const autoCount = screens.filter((s) => s.auto).length;

app.innerHTML = `
  ${gateScreen()}
  ${screens.map((s) => s.html).join('')}
  <div class="bars" aria-hidden="true">${'<span class="bar"><i></i></span>'.repeat(autoCount)}</div>
  <button type="button" class="sound no-tap" aria-label="Sound off">
    <svg class="sound__on" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
    <svg class="sound__off" viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </button>
  <p class="tap-hint" aria-hidden="true">Tap to skip &rsaquo;</p>`;

const gate = app.querySelector('.gate');
const sceneEls = [...app.querySelectorAll('.scene')];
screens.forEach((s, i) => { s.el = sceneEls[i]; });
const bars = [...app.querySelectorAll('.bar i')];
const soundBtn = app.querySelector('.sound');

// ---------- playback ----------
let index = -1;
let elapsed = 0;
let held = false;

function go(i) {
  if (i < 0 || i >= screens.length) return;
  const prev = screens[index];
  if (prev) {
    prev.el.classList.remove('is-active', 'play');
    prev.el.querySelectorAll('video').forEach((v) => { v.pause(); v.closest('.couple').classList.remove('is-playing'); });
    alphaVideo?.detach();
  }
  index = i;
  elapsed = 0;
  const s = screens[i];
  s.el.classList.add('is-active');
  void s.el.offsetWidth; // restart the entrance animations
  s.el.classList.add('play');
  screens.slice(i + 1, i + 3).forEach((next) => { const nv = next.el.querySelector('video'); if (nv) nv.preload = 'auto'; });
  const v = s.el.querySelector('video');
  if (v) {
    v.currentTime = 0;
    v.play().catch(() => {});
    const box = v.closest('.couple');
    alphaVideo.attach(v, v.parentElement, () => box.classList.add('is-playing'));
  }
  if (s.el.querySelector('.rsvp__scroll')) s.el.querySelector('.rsvp__scroll').scrollTop = 0;
  app.classList.toggle('is-auto', s.auto);
  app.classList.toggle('is-light', !s.auto);
  updateBars();
  s.onEnter?.();
}

function updateBars() {
  const s = screens[index];
  bars.forEach((b, i) => {
    const fill = !s.auto || i < index ? 1 : i === index ? Math.min(elapsed / s.duration, 1) : 0;
    b.style.transform = `scaleX(${fill})`;
  });
}

let last = 0;
function tick(t) {
  const dt = last ? Math.min(t - last, 100) : 0;
  last = t;
  const s = screens[index];
  if (s && s.auto && !held && !document.hidden) {
    elapsed += dt;
    updateBars();
    if (elapsed >= s.duration) go(index + 1);
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Tap right to skip, tap left to go back, press and hold to pause (like stories)
let holdTimer = 0;
let pressed = false;
app.addEventListener('pointerdown', (ev) => {
  const s = screens[index];
  if (!s?.auto || ev.target.closest('.no-tap')) return;
  pressed = true;
  holdTimer = setTimeout(() => { held = true; app.classList.add('is-held'); s.el.querySelector('video')?.pause(); }, 220);
});
app.addEventListener('pointerup', (ev) => {
  if (!pressed) return;
  pressed = false;
  clearTimeout(holdTimer);
  if (held) { held = false; app.classList.remove('is-held'); screens[index].el.querySelector('video')?.play().catch(() => {}); return; }
  const r = app.getBoundingClientRect();
  go(ev.clientX - r.left < r.width * 0.3 ? Math.max(index - 1, 0) : index + 1);
});
app.addEventListener('pointercancel', () => { pressed = false; clearTimeout(holdTimer); held = false; app.classList.remove('is-held'); });
app.addEventListener('contextmenu', (ev) => { if (screens[index]?.auto) ev.preventDefault(); });

// ---------- opening ----------
gate.querySelector('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  guest = gate.querySelector('input').value.trim();
  save('guest-name', guest);
  const hey = app.querySelector('.intro__hey');
  hey.textContent = firstName() ? `Hey ${guest.split(/\s+/)[0]}!` : 'Hey there!';
  app.querySelector('.rsvp__form [name=name]').value = guest;
  music.volume = 0.6;
  music.play().then(() => setSound(true)).catch(() => setSound(false));
  gate.classList.add('is-leaving');
  burst(0.8);
  setTimeout(() => gate.remove(), 700);
  go(0);
});

function setSound(on) {
  soundBtn.classList.toggle('is-off', !on);
  soundBtn.setAttribute('aria-label', on ? 'Sound off' : 'Sound on');
}
soundBtn.addEventListener('click', () => {
  if (music.paused) music.play().then(() => setSound(true)).catch(() => {});
  else { music.pause(); setSound(false); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) music.pause();
  else if (!soundBtn.classList.contains('is-off') && index >= 0) music.play().catch(() => {});
});

app.querySelectorAll('.replay').forEach((b) => b.addEventListener('click', () => go(0)));

// ---------- RSVP ----------
const form = app.querySelector('.rsvp__form');
form.querySelectorAll('.card').forEach((card) => card.addEventListener('click', () => {
  card.setAttribute('aria-pressed', card.getAttribute('aria-pressed') !== 'true');
  form.querySelector('[data-for=events]').textContent = '';
}));
form.addEventListener('input', (ev) => {
  const err = form.querySelector(`.field__error[data-for="${ev.target.name}"]`);
  if (err) err.textContent = '';
});
form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const data = {
    name: form.elements.name.value,
    phone: form.elements.phone.value,
    message: form.elements.message.value,
    events: [...form.querySelectorAll('.card[aria-pressed=true]')].map((c) => c.dataset.title),
    invited: events.map((e) => e.title),
    invite: inviteName,
    website: form.elements.website.value,
  };
  const errors = validateRsvp(data);
  form.querySelectorAll('.field__error').forEach((el) => { el.textContent = errors[el.dataset.for] || ''; });
  if (Object.keys(errors).length) {
    form.querySelector('.field__error:not(:empty)')?.closest('.field').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const btn = form.querySelector('.btn--send');
  const status = form.querySelector('.rsvp__status');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  status.textContent = '';
  try {
    await submitRsvp(data, config.rsvp.endpoint);
    guest = data.name.trim();
    save('guest-phone', data.phone.trim());
    save('guest-name', guest);
    showThanks(data.events);
  } catch (err) {
    console.error(err);
    status.textContent = "Oops, that didn't go through. Please check your connection and try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send RSVP';
  }
});

function showThanks(titles) {
  const first = events.filter((e) => titles.includes(e.title)).sort((a, b) => a.date.localeCompare(b.date))[0];
  thanks.el.querySelector('.thanks__name').textContent = guest ? `, ${guest.split(/\s+/)[0]}` : '';
  thanks.el.querySelector('.thanks__see').textContent = first ? `See you on ${shortDate(first.date)}!` : 'See you soon!';
  go(screens.indexOf(thanks));
  burst(1);
  setTimeout(() => burst(0.6), 900);
}

// ---------- confetti ----------
function burst(power = 1) {
  if (reduceMotion || typeof window.confetti !== 'function') return;
  const colors = ['#FF97FF', '#FFFFFF', '#FFD23F', '#E8283A', '#9DE8FF'];
  const r = app.getBoundingClientRect();
  const origin = (x) => ({ x: (r.left + r.width * x) / innerWidth, y: 0.55 });
  window.confetti({ particleCount: Math.round(90 * power), spread: 70, startVelocity: 42, origin: origin(0.15), angle: 60, colors, scalar: 0.9 });
  window.confetti({ particleCount: Math.round(90 * power), spread: 70, startVelocity: 42, origin: origin(0.85), angle: 120, colors, scalar: 0.9 });
}

// ---------- helpers ----------
function load(key) { try { return localStorage.getItem(key); } catch { return null; } }
function save(key, value) { try { localStorage.setItem(key, value); } catch {} }

// Warm the cache so every screen is ready when it arrives
for (const s of new Set(events.map((e) => e.art).concat(['finale', 'thanks', 'intro']))) new Image().src = `media/couple/${s}.webp`;
for (const e of events) new Image().src = `media/deco/${e.deco}.webp`;
