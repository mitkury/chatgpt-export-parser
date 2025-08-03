# ChatGPT Export Parser JS

Turn **ChatGPT data‑export ZIPs** into easy‑to‑use JavaScript objects.

> **Status:** ⚠️ Work‑in‑progress — the ChatGPT export format can change without notice. Expect breaking updates.

---

## Why?

OpenAI’s export gives you a single ZIP with `conversations.json`, files, feedback logs, etc.  This library unwraps that archive and surfaces:

* `conversations[]` – list of chats (title, timestamps, id…).
* `conversation.messages[]` – ordered turns (`user` / `assistant` / `system`).
* Attachments & safe URLs (when present).

All as plain JS objects or typed data (TS).  Perfect for analysis, search, or re‑publishing your own archive.

## Install

```bash
npm install chatgpt-export-parser  # package name TBD
```

## Quick start

```js
import { parseExport } from 'chatgpt-export-parser';

const data = await parseExport('ChatGPT-data.zip');
console.log(data.conversations[0].messages);
```

## API (early sketch)

| function                           | purpose                       |                                              |
| ---------------------------------- | ----------------------------- | -------------------------------------------- |
| \`parseExport(zipPath              | Buffer)\`                     | returns `{ conversations, files, metadata }` |
| `splitLargeJson(jsonPath, outDir)` | helper to shard huge archives |                                              |
| `toMarkdown(conversation)`         | convert a chat to MD          |                                              |

## Roadmap

* [ ] Stream parser for >1 GB exports.
* [ ] CLI (`chatgpt-export <zip> --markdown`).
* [ ] Project‑aware grouping once OpenAI exposes it.
* [ ] Tests against multiple export versions.

## Contributing

PRs welcome!  Drop issues if the schema shifts.

## License

MIT (or similar) – see `LICENSE` file.
