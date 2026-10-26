# Widget content: how to add things

The live widgets read studio content from the repo. When Jordi or Joery sends something in chat ("zet dit op de website in de widget"), add it like this, commit, and it is live after the next deploy.

- **Bericht van de studio** — `src/content/studio-posts.json`: `{ "id": "2026-11-03-koffie", "author": "jordi" | "joery", "date": "2026-11-03", "text": "… (max 140 tekens)", "image": "../assets/images/studio-posts/<file>.jpg" }` (image optional; put the photo in `src/assets/images/studio-posts/`). Newest is shown first. While the file is empty the widget is left out of every slot.
- **Kijk binnen** — `src/content/office-photos.json`: `{ "id": "2026-11-03", "image": "../assets/images/office/2026-11-03.jpg", "date": "2026-11-03" }`. The newest photo is shown with "foto van vandaag / … geleden"; "vers" only on the day itself.
- **Stories** — `src/content/stories.json`: `{ "id": "…", "label": "≤ 18 tekens", "image": "../assets/images/…", "caption": "≤ 90 tekens" }`. The first five are shown, in file order.
- **Spotify** — `src/content/tracks.json`: `{ "id": "…", "url": "<Spotify track share link>", "artist": "…" }`. Title and cover come from Spotify at build; add `title`/`cover` only as a fallback. Album and playlist links are rejected by the build.
- **Where widgets appear** — `src/data/widgets.ts`: `pools` (what a slot may pick at random) and `fixed` (per page, per slot). Overview on `/widgets`.
- **A new widget** — a folder in `src/widgets/<id>/` (see `CLAUDE.md`); it shows up on `/widgets` and can be used in `pools`/`fixed` by its folder name.
