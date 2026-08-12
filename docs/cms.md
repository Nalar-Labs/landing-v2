# Editing portfolio content

Portfolio projects are JSON files in `src/content/portfolio/` — one file per
project. They are edited through Sveltia CMS, a git-based CMS: saving in the
CMS writes these files; publishing is a normal git commit + push + deploy.

## Local editing (no setup required)

1. `npm run dev`
2. Open http://localhost:5173/admin/index.html in Chrome or Edge
   (the local workflow uses the File System Access API, which Firefox and
   Safari don't support).
3. Click **Work with Local Repository** and select the repo folder.
4. Edit / add projects. Saving writes the JSON files to disk.
5. Review with `git diff`, then commit and push to publish.

Field notes:
- **Order** controls carousel position (lowest first) and must be unique.
- **Draft** hides an item from the site without deleting it.
- **Body** is the popup's content (markdown).
- Required fields (title, summary, body) must be non-empty — an invalid
  file fails the build on purpose rather than silently dropping the item.

## Editing from the deployed site (optional, not yet set up)

To let someone edit at https://<site>/admin/ without cloning the repo, the
GitHub backend needs OAuth:

1. Deploy https://github.com/sveltia/sveltia-cms-auth to Cloudflare Workers
   (free tier is fine).
2. Register a GitHub OAuth app and give its credentials to the Worker.
3. Add `base_url: https://<worker-url>` under `backend:` in
   `public/admin/config.yml`.
4. Before enabling production sign-in, pin the `@sveltia/cms` script in
   `public/admin/index.html` to an exact version (e.g.
   `@sveltia/cms@X.Y.Z`) — an unpinned third-party script on a page that
   handles GitHub tokens is a supply-chain risk.

Until then, `/admin/` on the deployed site will show a GitHub sign-in that
cannot complete — that is expected.

## Adding video

Videos are **hosted externally** — they are never uploaded into this repo.
Git keeps every version of every file forever, and GitHub rejects files over
100 MB, so a video committed here would bloat the repo permanently.

1. Upload the video to YouTube or Vimeo.
2. Paste its link into **Video URL**.
3. Set a **Cover image** — it is the poster frame shown before playback, on
   both the card and the popup. Without it the video shows a grey placeholder.
4. Optionally add **Extra images**; they become swipeable slides after the
   video in the popup.

Anything other than a YouTube or Vimeo link is rejected — by the CMS as you
type, and by the build as a backstop. Nothing loads from the video host until
a visitor actually presses play.
