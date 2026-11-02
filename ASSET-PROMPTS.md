# Asset prompts: Yashwant weds Aditi (ref2 style)

The page is built like ref2.mp4: full-screen sections that play one after another. Each section
has a flat colour background, white line-art decorations, a title, date and venue in text, and
an animated cartoon couple in the lower half. It ends on a dark RSVP screen.

**I build in code:** background colours, the heart-shaped "Yashwant + Aditi" logo, all text,
transitions, confetti, and the RSVP form.
**You generate:** the couple animations, the white line-art decorations, and the music.

Put every file in `assets/` using the filename given.

---

## Rules for every couple image and video

1. **References:** attach `assets/ref/photo-couple-1.png` and `photo-couple-2.png` for
   likeness, plus `assets/ref/ref2-style-11.png` for the drawing style. Once you have
   `character-sheet.png` (step 0), attach that instead of the photos.
2. **Green screen:** use a flat, solid **#00FF00** background with no floor, no shadows and no
   gradient. I replace the green with the section's colour, so we can still change colours
   later.
3. **No green or teal anywhere on the couple** (clothes, jewellery, garlands), because those
   parts would disappear along with the background.
4. **Portrait 9:16** (1080×1920 is ideal). Show the couple's full body in the **bottom 55%**
   of the frame. Keep the top 40% empty green, because that's where the title and date go.
5. **No text, letters or watermarks.**
6. **Videos:** use image-to-video (Kling, Veo, Runway or similar), 5–6 s long, with the camera
   fixed. Download as MP4. Every video except `finale` must loop smoothly (see below).

### Making the videos loop smoothly

The goal is that the **last frame is the same as the first frame**, so when the video jumps back
to the start you can't see the join.

1. **Use the same still image as both the start frame and the end frame.** Most tools have this
   option:
   - Kling: *Start & End Frames*
   - Veo / Google Flow: *Frames to Video*, first and last frame
   - Runway: first frame + last frame
   - Luma: tick *Loop*

   This is the most reliable way.
2. **Describe the motion as "out and back".** Each motion prompt below starts from the pose in
   the still image, moves through the gesture, and comes back to that exact pose.
3. **Check it:** play the video on repeat. If you see a jump at the join, try generating again,
   or send it to me as it is. I can smooth the join afterwards (a short crossfade, or playing it
   forwards then backwards), though a clean loop from the tool always looks best.

### Style block (paste at the start of every couple prompt)

> Hand-drawn 2D cartoon in a playful indie wedding-invitation style: thick, slightly wobbly
> black marker outlines, flat bold colours, no gradients, almost no shading, simple rounded
> faces, small dot eyes, big happy grins, chunky expressive hands. Indian couple drawn to look
> like the reference photos: **Yashwant** is tall, with short black hair, a full dark beard and
> a wide warm grin, and no glasses. **Aditi** has long dark wavy hair past her shoulders, a
> huge open smile and a small red bindi, and no glasses. Solid flat #00FF00 green background,
> no ground, no shadows, no text.

### Motion block (paste at the start of every video prompt)

> Hand-drawn 2D cel animation at 12 frames per second, with slight boiling line wobble like
> traditional animation. Camera completely still. Background stays flat solid green the whole
> time. Perfect seamless loop: the first frame and the last frame are identical. The characters
> start in the exact pose of the input image, perform the gesture, and return smoothly to that
> exact same pose, position, expression and framing at the end, with no drift and no zoom.

---

## 0. Character sheet (make this first)

`character-sheet.png`: style block, then:
> Character turnaround sheet of Yashwant and Aditi standing side by side, front view and 3/4
> view, smiling, in simple everyday clothes (he in a mustard polo and black trousers, she in a
> pink-and-yellow kurta). Full body.

Use this sheet as the reference for everything below so they look the same in every scene.

---

## 1. Couple scenes

Make a still image first (style block + **Still**), then animate it (motion block + **Motion**).
Every scene is **one simple gesture that repeats**, like ref2: they beckon, dance, bow and wave.
This gives cleaner loops than a story with several steps.
Save both, e.g. `intro.png` and `intro.mp4`.

### `intro`: welcome screen (like the big faces in ref2)
- **Still:** Extreme close-up, cropped at the chest, of both of them side by side and cheek to
  cheek, beaming at the viewer and holding out cupped hands towards the camera as if offering
  an invitation. He wears a royal-blue kurta, she wears a hot-pink saree blouse with a gold
  necklace and jhumkas. *(For this one only, the faces fill the frame. Ignore rule 4.)*
- **Motion:** Both beckon the viewer towards them with their cupped hands, again and again ("come, come!"), swaying slightly side to side with big grins and a blink. They finish back in exactly the starting pose.

### `haldi`: Haldi & Mehendi · Mon 30 Nov
- **Still:** Both sitting cross-legged on low wooden stools, in yellow outfits (he in a yellow
  kurta, she in a yellow-and-orange lehenga with marigold flower jewellery), with haldi paste
  smudged on their cheeks. She holds up her hands to show bright orange-brown henna designs, and
  he holds a small brass bowl of haldi.
- **Motion:** She keeps playfully dabbing haldi on his cheek and he keeps laughing and leaning away, both shoulders bouncing with laughter. They finish back in exactly the starting pose.

### `engagement`: Engagement Ceremony · Tue 1 Dec
- **Still:** Standing side by side. She holds up her hand to show off a big sparkling
  engagement ring, grinning; he points at the ring proudly. He wears a cream bandhgala, she wears a
  pastel-pink lehenga.
- **Motion:** She keeps happily wiggling her ringed hand to show it off while he points at it proudly; both bounce on their toes. They finish back in exactly the starting pose.

### `baraat`: Baraat, Toran & Varmala · Tue 1 Dec
- **Still:** He wears a gold sherwani, a red safa turban and a flower sehra, mid-bhangra with
  both arms up. She wears a red lehenga, standing beside him and holding up a big
  red-and-white flower varmala garland.
- **Motion:** He keeps doing a bouncy bhangra step with both arms up and shoulder shimmies; she dances along, swinging the varmala side to side. They finish back in exactly the starting pose.

### `wedding`: Wedding Ceremony (Lagan Phere) · Wed 2 Dec
- **Still:** Standing side by side facing the viewer with hands folded in namaste, both wearing
  thick flower garlands. He wears an ivory sherwani, a red safa and red churidar; she wears a
  red bridal saree with a gold border and her dupatta over her head. His stole and her
  dupatta are tied in a knot between them.
- **Motion:** Both keep bowing gently in namaste and coming back up, smiling at the viewer; the garlands sway. They finish back in exactly the starting pose.

### `reception`: Wedding Reception · Thu 3 Dec
- **Still:** Slow-dancing ballroom style: her hand on his shoulder, his on her waist. He wears
  a black tuxedo with a bow tie, she wears a lavender saree.
- **Motion:** They keep swaying in a slow dance, turning a little left and right, cheek to cheek. They finish back in exactly the starting pose.

### `finale`: the lift and spin (the end of the reception, like ref2)
- **Still:** Same outfits as `reception`. He lifts her up by the waist; she has her arms
  stretched wide, laughing.
- **Motion:** He spins her round while the camera rises above them and pushes in, finishing on
  an overhead close-up of their two laughing faces filling the frame. *(This one doesn't need
  to loop, and the camera can move.)*

### `afterparty`: After Party · Fri 4 Dec (party link only)
- **Still:** Disco party pose: he does a "Saturday Night Fever" point to the sky in a royal-blue
  shirt and black flared trousers; she does a rock-on hand while holding a glass, in a hot-pink
  sequin dress.
- **Motion:** Both keep grooving: disco points up and down, shoulder bounces, her hair swinging. They finish back in exactly the starting pose.

### `thanks`: shown after a guest sends their RSVP
- **Still:** Both in the `wedding` outfits, standing close together and waving at the viewer with
  both hands raised, very happy.
- **Motion:** Both keep waving goodbye at the viewer with both hands, bouncing happily. They finish back in exactly the starting pose.

---

## 2. White line-art decorations (still images, one per section)

These go around the edges of each section, like ref2's curtains, disco ball, fairy lights and
leaves. Don't use the style block for these. Use this base prompt, then add the line for each
section:

> Decorative frame illustration for a portrait phone screen, 9:16. Hand-drawn white marker
> line art only, single line weight, playful and loose, on a pure black background. Elements
> hang from the top edge and grow up from the bottom edge and sides; **the centre and the area
> behind the middle stays completely empty black**. No text, no colour, no fill, no shading.

| File | Add |
|---|---|
| `deco-haldi.png` | Marigold garland strings hanging from the top, a kalash and brass bowls along the bottom, scattered marigold flowers and a few henna-pattern swirls. |
| `deco-engagement.png` | Strings of little hearts and stars hanging from the top, a few balloons in the corners, sparkle marks. |
| `deco-baraat.png` | A toran door hanging across the top, bunting flags, a dhol drum and trumpets in the bottom corners, music notes. |
| `deco-wedding.png` | Mandap pillars with banana leaves up both sides, hanging bells and flower strings from the top, a small havan fire at the bottom centre. |
| `deco-reception.png` | Draped curtains and fairy-light swags across the top, hanging lanterns, faint round dinner tables and chairs along the bottom. |
| `deco-afterparty.png` | A big disco ball in the top corner with sparkle rays, speakers in the bottom corners, music notes and stars. |
| `deco-rsvp.png` | Small envelopes, hearts and stars scattered loosely around the outer edges only. |

---

## 3. Music

`music.mp3`, about 40–60 s, long enough to cover the whole film (Suno, Udio or similar):
> Upbeat, happy Indian wedding instrumental with a playful quirky feel, dhol and tabla
> groove, shehnai and mandolin melody, light ukulele and claps, Bollywood rom-com vibe,
> joyful and bouncy, no vocals, 115 bpm.

If you'd rather use the song from ref2.mp4 or ref.mp4, just tell me and I'll take it from there.
