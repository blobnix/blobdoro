# <img src="assets/blobdoro.png" width="32" alt="Description"> Blobdoro

![img](https://i.postimg.cc/L6PkJwPm/blobdoro-website-img.png)

Blobdoro is a browser-based Pomodoro timer for alternating focused work sessions with short and long breaks. It includes lo-fi music and a compact picture-in-picture timer on supported browsers.

## Try it online
Use it directly in your browser: https://blobdoro.netlify.app/

## Features

- Configurable focus, break, and long-break durations.
- A long break after every four completed focus sessions.
- Optional automatic start of the next session.
- Shuffled background music from the included playlist, plus a bell when a session ends.
- Picture-in-picture timer on browsers that support the Document Picture-in-Picture API.

## How to use

- Select **Start**, **Pause**, **Reset**, or **Skip** to control the current session.
- Open the settings using the gear icon. The default durations are 25 minutes for focus, 5 minutes for a break, and 15 minutes for a long break.
- Turn on **Auto Break** to start the next session automatically when one ends. It is off by default.
- Music is enabled by default and plays while the timer is running.
- Select the picture-in-picture button to open the separate timer window. Availability depends on browser support.

## Music playlist

Audio files are listed in [`music/playlist.json`](music/playlist.json). To add or remove tracks, update that JSON array and put each referenced `.mp3`, `.ogg`, `.wav`, or `.m4a` file in the `music` directory. Track filenames must match exactly.

## Project files

- `index.html` - page structure and settings controls
- `style.css` - layout and visual styles
- `script.js` - timer, settings, audio, and picture-in-picture behavior
- `assets/` - background image and icon
- `music/` - audio tracks and playlist
