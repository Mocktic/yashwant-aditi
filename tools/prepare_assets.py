"""Turn the raw assets into web-ready media for the invite.

    assets/video-input/<scene>.png  green-screen stills  -> site/media/couple/<scene>.webp (transparent)
    assets/<scene>.mp4              green-screen videos  -> site/media/couple/<scene>.mp4  (colour | alpha side by side;
                                    9:16 Gemini videos lose the watermark and are cropped to the couple's square)
    assets/deco-clean/deco-*.png    white line art       -> site/media/deco/<name>.webp
    assets/music.mp3                the song             -> site/media/music.mp3

It also writes site/media/manifest.json listing which scenes have a video, so the page plays the
video where there is one and the still everywhere else. Run it again after adding new files:

    python3 -m venv .venv && .venv/bin/pip install pillow numpy scipy
    .venv/bin/python tools/prepare_assets.py
"""
import json
import shutil
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets'
OUT = ROOT / 'site' / 'media'
VIOLET = (0x61, 0x48, 0xF0)  # keep in sync with --violet in site/styles.css
SCENES = ['intro', 'haldi', 'engagement', 'baraat', 'wedding', 'reception', 'finale', 'afterparty', 'thanks']
STILL_SIZE = 900
VIDEO_SIZE = 720
WATERMARK_ALPHA = ROOT / 'tools' / 'gemini-watermark-alpha.png'
WATERMARK_AT = (560, 1120)


def key(rgb):
    """Alpha matte for a green-screen frame. Background is green touching the frame edge, plus
    enclosed gaps (between an arm and a body) that are pure screen green. Drawn green leaves
    (garlands, the haldi skirt) are a duller green with red in them, so they are kept."""
    a = rgb.astype(np.int16)
    spill = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    core = spill > 60
    labels, count = ndimage.label(core)
    edge_ids = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
    medians = ndimage.median(spill, labels, np.arange(1, count + 1)) if count else []
    screen_ids = np.arange(1, count + 1)[np.asarray(medians) > 150]
    bg = np.isin(labels, np.union1d(edge_ids[edge_ids > 0], screen_ids))
    near = ndimage.binary_dilation(bg, iterations=4)  # outline anti-aliasing next to the background
    soft = 1 - np.clip((spill - 15) / 70, 0, 1)
    alpha = np.where(bg, 0.0, np.where(near, soft, 1.0))
    out = a.copy()
    # despill: pull the green tint out of the edge pixels
    out[..., 1] = np.where(near, np.minimum(a[..., 1], np.maximum(a[..., 0], a[..., 2])), a[..., 1])
    return out.clip(0, 255).astype(np.uint8), alpha


def still(scene):
    src = SRC / 'video-input' / f'{scene}.png'
    if not src.exists():
        return False
    im = Image.open(src).convert('RGB').resize((STILL_SIZE, STILL_SIZE), Image.LANCZOS)
    rgb, alpha = key(np.asarray(im))
    rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
    Image.fromarray(rgba, 'RGBA').save(OUT / 'couple' / f'{scene}.webp', quality=88, method=6)
    return True


def remove_watermark(frame, alpha):
    """Undo the Gemini sparkle: it is white blended at a fixed spot (x 560, y 1120 on a
    720x1280 frame) with the opacity map in tools/gemini-watermark-alpha.png."""
    x, y = WATERMARK_AT
    s = alpha.shape[0]
    patch = frame[y:y + s, x:x + s].astype(np.float32)
    a = alpha[..., None]
    frame[y:y + s, x:x + s] = ((patch - 255 * a) / (1 - a)).round().clip(0, 255).astype(np.uint8)


def video(scene):
    """Square videos (1:1) are used as they are. Portrait Gemini videos (9:16, made from
    assets/video-input-9x16/) get the watermark removed, then the loops are cropped back to the
    square the couple stands in; `finale` stays full-screen because its camera move fills the frame.

    Phones can't play transparent video everywhere, so each frame is stored as colour on the left
    and its transparency (white = solid) on the right of a normal MP4; site/alpha-video.js puts the
    two back together in the browser."""
    src = SRC / f'{scene}.mp4'
    if not src.exists():
        return False
    w, h = (int(v) for v in subprocess.check_output(
        ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', str(src)]
    ).decode().strip().split(','))
    portrait = h > w
    if portrait and (w, h) != (720, 1280):
        raise SystemExit(f'{src.name}: expected a 720x1280 Gemini video, got {w}x{h}')
    fullscreen = portrait and scene == 'finale'
    out_w, out_h = (720, 1280) if fullscreen else (VIDEO_SIZE, VIDEO_SIZE)
    alpha = np.asarray(Image.open(WATERMARK_ALPHA), np.float32) / 255 if portrait else None
    dec = subprocess.Popen(
        ['ffmpeg', '-v', 'error', '-i', str(src), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
        stdout=subprocess.PIPE)
    enc = subprocess.Popen(
        ['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{out_w * 2}x{out_h}', '-r', '24', '-i', '-',
         '-vf', 'scale=out_color_matrix=bt709:out_range=tv', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
         '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
         '-movflags', '+faststart', '-an', str(OUT / 'couple' / f'{scene}.mp4')],
        stdin=subprocess.PIPE)
    bgcol = np.array(VIOLET, dtype=np.uint8)
    while True:
        buf = dec.stdout.read(w * h * 3)
        if len(buf) < w * h * 3:
            break
        frame = np.frombuffer(buf, np.uint8).reshape(h, w, 3).copy()
        if portrait:
            remove_watermark(frame, alpha)
            if not fullscreen:
                frame = frame[h - w:]  # the couple's square sits at the bottom of the 9:16 frame
        if frame.shape[:2] != (out_h, out_w):
            frame = np.asarray(Image.fromarray(frame).resize((out_w, out_h), Image.LANCZOS))
        rgb, matte = key(frame)
        colour = np.where(matte[..., None] > 0, rgb, bgcol).astype(np.uint8)
        alpha_half = np.repeat((matte * 255).round().astype(np.uint8)[..., None], 3, axis=2)
        enc.stdin.write(np.concatenate([colour, alpha_half], axis=1).tobytes())
    enc.stdin.close()
    enc.wait()
    dec.wait()
    return True


def decos():
    for src in sorted((SRC / 'deco-clean').glob('deco-*.png')):
        im = Image.open(src).convert('RGBA')
        w = 720
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        im.save(OUT / 'deco' / f'{src.stem.removeprefix("deco-")}.webp', quality=90, method=6)


def music():
    src = SRC / 'music.mp3'
    if src.exists():
        shutil.copy(src, OUT / 'music.mp3')


def main():
    (OUT / 'couple').mkdir(parents=True, exist_ok=True)
    (OUT / 'deco').mkdir(parents=True, exist_ok=True)
    manifest = {'stills': [], 'videos': [], 'durations': {}}
    for scene in SCENES:
        if still(scene):
            manifest['stills'].append(scene)
        if video(scene):
            manifest['videos'].append(scene)
            manifest['durations'][scene] = round(float(subprocess.check_output(
                ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(OUT / 'couple' / f'{scene}.mp4')]
            ).decode()), 2)
        print(f'{scene:11} still={scene in manifest["stills"]} video={scene in manifest["videos"]}')
    decos()
    music()
    (OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')


if __name__ == '__main__':
    main()
