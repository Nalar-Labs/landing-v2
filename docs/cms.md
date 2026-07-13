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

Until then, `/admin/` on the deployed site will show a GitHub sign-in that
cannot complete — that is expected.
