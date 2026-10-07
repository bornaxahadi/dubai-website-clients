# dubai-website-clients

Client demo websites, published with GitHub Pages at **https://yournewsite.world**.

## The folder rule

Each client gets one folder at the top level, and the folder name becomes the web address.

| Folder in this repo | Live preview link |
|---|---|
| `dr-carson/index.html` | https://yournewsite.world/dr-carson/ |
| `dr-juan-carlos/index.html` | https://yournewsite.world/dr-juan-carlos/ |
| `gs-polyclinic/index.html` | https://yournewsite.world/gs-polyclinic/ |
| `example-client/index.html` | https://yournewsite.world/example-client/ |

Folder names use lowercase letters, numbers and dashes only (for example `dr-carson`, `al-noor-dental`). No spaces or capitals.

Every folder must have an `index.html` file; that is the page the client sees. Images, CSS and other files for that client go inside the same folder.

## Other files

- `index.html` at the top level is the landing page for https://yournewsite.world. Its "Sample websites" gallery lists every client sample: add a card there (newest first) and a thumbnail at `thumbs/<folder>.jpg` for each new client (`tools/thumb.js` takes the screenshot).
- `CNAME` tells GitHub Pages which domain this site uses. Do not delete it.

Changes go live about a minute after they are saved to the `main` branch.
