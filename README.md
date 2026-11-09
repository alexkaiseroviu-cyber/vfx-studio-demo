# Helios VFX Studio Demo

A no-build, browser-based VFX preview studio prototype. It creates a procedural animated energy-rift composite and lets you adjust the look, import local media, seek/play the preview, save settings, and export a PNG frame.

## Run locally

You can open `index.html` directly, or serve the project folder:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Demo features

- Animated canvas preview with procedural rift rings, light streaks, particles, and film grain.
- Interactive intensity, bloom, distortion, grain, and color-shift controls.
- One-click look presets and reset-to-defaults.
- Local image and video import for preview compositing. Imported media is not uploaded.
- Play/pause, loop toggle, click-to-seek timeline, and frame/timecode readout.
- Save/restore effect settings and playhead position using browser local storage.
- Export the current preview frame as a PNG.
- Responsive dark studio interface; no package installation or build step required.

## Limitations

This is a front-end demo, not a production compositor or renderer. PNG export captures the current preview canvas; it does not render a full-resolution sequence. Browser codecs determine which videos can be previewed, and imported media is session-local.

## Files

- `index.html` — studio interface and controls
- `styles.css` — responsive visual design
- `app.js` — animation, media preview, presets, timeline, save, and PNG export
