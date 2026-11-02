# Yashwant weds Aditi · e-invite

A phone-first invitation that plays like a story (inspired by `ref2.mp4`, in the violet + pink of the
save-the-date `ref.mp4`). The guest types their name and taps **Open Invitation**. The music starts,
then each screen plays by itself:

intro (couple calling you in) → Save the Date → one screen per event → the reception lift-and-spin
(only on links with the reception) → RSVP → thank-you with confetti.

Tap right to skip, tap left to go back, press and hold to pause. On a laptop it shows as a phone-width column.

## Run it

```bash
python3 tools/serve.py     # open http://localhost:5180 (also works from your phone on the same Wi-Fi)
```

`site/` is the whole website, plain static files with no build step. On **Vercel**, import this repo
with Framework Preset **Other** and no build command; `vercel.json` serves `site/` and keeps search
engines out.

The raw source media (`assets/`, the reference videos) is kept out of this public repo on purpose.
The asset script below needs that folder locally.

## Links to share

| Guests | Link | Events |
|---|---|---|
| Everyone (all the days) | `/` or `/?invite=all` | Haldi & Mehendi, Engagement, Baraat & Varmala, Wedding, Reception |
| Haldi + Reception | `/?invite=haldi-reception` | Haldi & Mehendi (30 Nov), Reception (3 Dec) |
| Reception only | `/?invite=reception` | Reception (3 Dec) |
| Party only | `/?invite=party` | After Party (4 Dec, Pushkar) |

The link decides which event screens, Save the Date date(s) and RSVP cards the guest sees. Add or
change lists under `invites` in `site/config.js`.

## Changing content

Everything editable is in **`site/config.js`**: names, events (date, time, venue, map link), the
guest lists, and how long each screen stays.

## Adding the couple videos

1. Make each video from the matching still in `assets/video-input/` (see `ASSET-PROMPTS.md`).
2. Save it as `assets/<scene>.mp4`. The scene names are `intro`, `haldi`, `engagement`, `baraat`,
   `wedding`, `reception`, `finale`, `afterparty`, `thanks`.
   Square (1:1) videos and 9:16 Gemini videos made from `assets/video-input-9x16/` both work. The
   9:16 ones get the Gemini sparkle removed and are cropped back to the couple's square, except
   `finale`, which stays full-screen.
3. Run the asset script. It removes the green screen and switches that screen from the still to the
   video. Each video is stored as picture + transparency side by side, and `site/alpha-video.js`
   recombines them, so the decorations show behind the couple:

```bash
python3 -m venv .venv && .venv/bin/pip install pillow numpy scipy   # first time only
.venv/bin/python tools/prepare_assets.py
```

The same script turns the green-screen stills into transparent images and the white line art
(`assets/deco-clean/`) into web images. It needs `ffmpeg` (`brew install ffmpeg`).

## Music

`site/media/music.mp3` is currently the soundtrack from `ref.mp4`, as a stand-in. To use your own
song, save it as `assets/music.mp3` and run the asset script again.

## RSVPs

They go to the **same Google Sheet** as the first invite (the Apps Script web app in
`ShambhuWedInvite/scripts/rsvp-apps-script.gs`). Each row has the time, name, events attending
(`A | B`), message, and the link the guest used (`all`, `haldi-reception`, `reception`, `party`).
The event names match the first invite's, so the Summary tab's counts keep working.
