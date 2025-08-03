This is a context for AI editor/agent about the project. It's generated with a tool Airul (https://github.com/mitkury/airul) out of 3 sources. Feel free to edit .airul.json to change the sources and configure editors. Run `airul gen` to update the context after making changes to .airul.json or the sources. Remember to update TODO-AI.md after major changes in the project, keeping track of completed tasks and new developments.

# From README.md:

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
---

# From docs/dev/rules.md:

# Rules for AI devs

## Publishing Steps
When publishing, follow these steps in order:

Build and test: npm run build && npm test
Commit changes with scope prefix and description; e.g `feat(cool-feature): make it work` or `docs: add important info about X`
Push changes: git push
Create patch version: npm version patch
Push tags: git push --tags
Publish: npm publish
---

# From TODO-AI.md:

# AI Workspace

## Active Task
JS package for processing export archives from ChatGPT

## Status
⏳ In Progress

## Context & Progress
- Created: 2025-08-03
- I (AI) will maintain this document as we work together
- My current focus: Understanding and working on the active task

## Task History
- Initial task: JS package for processing export archives from ChatGPT

## Notes
- I'll update this file to track our progress and maintain context
- I'll keep sections concise but informative
- I'll update status and add key decisions/changes
- I'll add new tasks as they come up