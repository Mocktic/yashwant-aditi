// All invitation content lives here. Edit this file to change names, events, venues or links.

export default {
  couple: ['Yashwant', 'Aditi'],

  // date: YYYY-MM-DD · start/end: 24-hour HH:MM (IST) · art: the couple picture in media/couple/
  // title is the full name stored in the RSVP sheet; label is the short name on screen.
  events: {
    haldi: {
      title: 'Haldi & Mehendi',
      label: 'Haldi & Mehendi',
      date: '2026-11-30',
      start: '13:00',
      venue: 'RTDC Ajmer',
      city: 'Ajmer, Rajasthan',
      map: 'https://maps.google.com/?q=RTDC+Hotel+Ajmer',
      art: 'haldi',
      deco: 'haldi',
    },
    engagement: {
      title: 'Engagement Ceremony',
      label: 'Engagement',
      date: '2026-12-01',
      start: '14:30',
      venue: 'Badi Sadri',
      city: 'Chittorgarh, Rajasthan',
      map: 'https://maps.google.com/?q=Badi+Sadri,+Rajasthan',
      art: 'engagement',
      deco: 'engagement',
    },
    baraat: {
      title: 'Baraat, Toran & Varmala',
      label: 'Baraat & Varmala',
      date: '2026-12-01',
      start: '17:00',
      venue: 'Badi Sadri',
      city: 'Chittorgarh, Rajasthan',
      map: 'https://maps.google.com/?q=Badi+Sadri,+Rajasthan',
      art: 'baraat',
      deco: 'baraat',
    },
    lagan: {
      title: 'Wedding Ceremony',
      label: 'Wedding',
      sub: 'Lagan Phere',
      date: '2026-12-02',
      start: '07:00',
      venue: 'Badi Sadri',
      city: 'Chittorgarh, Rajasthan',
      map: 'https://maps.google.com/?q=Badi+Sadri,+Rajasthan',
      art: 'wedding',
      deco: 'wedding',
    },
    reception: {
      title: 'Wedding Reception',
      label: 'Reception',
      date: '2026-12-03',
      start: '18:00',
      venue: 'RTDC Ajmer',
      city: 'Ajmer, Rajasthan',
      map: 'https://maps.google.com/?q=RTDC+Hotel+Ajmer',
      art: 'reception',
      deco: 'reception',
    },
    afterparty: {
      title: 'After Party',
      label: 'After Party',
      date: '2026-12-04',
      start: '18:00',
      venue: 'Pushkar',
      city: 'Pushkar, Rajasthan',
      map: 'https://maps.google.com/?q=Pushkar,+Rajasthan',
      art: 'afterparty',
      deco: 'afterparty',
    },
  },

  // One link per guest list: https://<site>/?invite=<name>. No ?invite= means `defaultInvite`.
  // save: the date(s) on the "Save the Date" screen.
  invites: {
    all: { events: ['haldi', 'engagement', 'baraat', 'lagan', 'reception'], save: ['lagan'] },
    'haldi-reception': { events: ['haldi', 'reception'], save: ['haldi', 'reception'] },
    reception: { events: ['reception'], save: ['reception'] },
    party: { events: ['afterparty'], save: ['afterparty'] },
  },
  defaultInvite: 'all',

  // How long each screen stays before moving on by itself (milliseconds)
  timing: { intro: 5500, save: 5000, event: 5000, finale: 3300 },

  // Same Google Sheet as the first invite (Apps Script web app, see README)
  rsvp: {
    endpoint: 'https://script.google.com/macros/s/AKfycbwT0SRyM5UQXaihBD2qsQ1nVW-8LP64LjIm0wlSZyesqz3UM3ZFaNZ5Me5EDO-uiRd6zQ/exec',
  },
};
