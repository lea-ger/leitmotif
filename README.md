# Leitmotif — RTC Demo (Vue 3 + Vite)

A minimal Real‑Time Collaboration demo: one Host shares a QR code; multiple Clients (phones) join and stream accelerometer/orientation data via WebRTC (PeerJS). The Host maps motion to audio using Tone.js.

## Features
- Host page generates a room ID and QR join link
- Client page captures `devicemotion`/`deviceorientation` (with iOS permission flow)
- PeerJS data channels for low‑latency sensor streaming
- Tone.js synth on Host maps motion to pitch/volume/detune
- Vue Router with `Home`, `Host`, and `Client` views

## Getting started
1. Install dependencies
   ```
   npm install
   ```
2. Run the dev server
   ```
   npm run dev
   ```
3. Open the Host in a desktop browser
   - Navigate to `http://localhost:5173/host` (or the URL shown in the terminal)
   - Click "Start Audio" once to unlock audio on the Host
   - A QR code appears with the client join URL
4. Join from smartphones as Clients
   - Scan the QR code or open the shared link (e.g., `http://YOUR_HOST/client/ROOM_ID`)
   - Tap "Start" to grant motion permissions (required on iOS)
   - Move the phone and hear the Host synth react

## Notes
- Localhost is considered a secure context, which is required for motion sensors on iOS. For remote testing, use HTTPS.
- The default PeerJS cloud signaling server (`0.peerjs.com`) is used. For production, run your own signaling server.
- Sensor rate is throttled to ~20 Hz to reduce bandwidth.

## Tech stack
- Vue 3, Vite, TypeScript
- Vue Router
- PeerJS for WebRTC data channels
- Tone.js for Web Audio synthesis
- `qrcode.vue` for QR rendering

## File overview
- `src/router.ts` — routes: `/`, `/host`, `/client/:roomId?`
- `src/views/HomeView.vue` — landing, navigation, enter Host ID
- `src/views/HostView.vue` — creates room, shows QR, audio mapping
- `src/views/ClientView.vue` — connects to Host, streams sensors
- `src/App.vue` — shell with nav + `RouterView`
