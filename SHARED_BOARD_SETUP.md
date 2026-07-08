# Shared group board setup

Turn the savings dashboard into a **live communication board** so Oscar, Leah, Raul, Rosa, Lily, Mike, and Yolee all see the same contributions.

## Why this is needed

GitHub Pages is a static site — there is no server database. By default, each phone saves its own copy in the browser. **Firebase Firestore** adds a free shared cloud document that updates in real time.

## Quick steps

1. Create a Firebase project at https://console.firebase.google.com/
2. Add a web app and copy the config keys
3. Enable **Firestore Database** (production mode)
4. Set Firestore rules to allow read/write on `trips/{tripId}` (see `group-sync.html`)
5. Edit `firebase-config.js`:
   - `enabled: true`
   - paste your `apiKey`, `authDomain`, `projectId`, etc.
6. Push to `main` — the site redeploys automatically

## Verify it works

1. Open the trip site on two phones (or a phone + laptop)
2. The savings banner should say **Live group board** (green dot)
3. Add a test contribution on one device — it should appear on the other within a second

## Files

| File | Purpose |
|------|---------|
| `firebase-config.js` | Your Firebase keys (`enabled: true` to activate) |
| `sync.js` | Real-time read/write logic |
| `app.js` | Contribution form + group feed UI |
| `group-sync.html` | Step-by-step guide on the live site |

## Security note

This board is for trip planning amounts and notes (Zelle, Venmo, cash) — **not** bank account numbers. The site URL is semi-private; Firestore rules can be tightened later with a trip passcode if needed.
