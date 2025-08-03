# ChatGPT Export Parser JS

Turn **ChatGPT data‑export ZIPs** into easy‑to‑use JavaScript objects.

> **Status:** ✅ Working — Successfully parses ChatGPT export archives and extracts conversations with full message history.

---

## Why?

OpenAI's export gives you a single ZIP with `conversations.json`, files, feedback logs, etc. This library unwraps that archive and surfaces:

* `conversations[]` – list of chats (title, timestamps, id…).
* `conversation.messages[]` – ordered turns (`user` / `assistant` / `system`).
* Attachments & safe URLs (when present).

All as plain JS objects or typed data (TS). Perfect for analysis, search, or re‑publishing your own archive.

## Install

```bash
npm install chatgpt-export-parser
```

## Quick start

```js
import { parseExport } from 'chatgpt-export-parser';

const data = await parseExport('ChatGPT-data.zip');
console.log(data.conversations[0].messages);
```

## API

| function                           | purpose                       |                                              |
| ---------------------------------- | ----------------------------- | -------------------------------------------- |
| `parseExport(zipPath)`             | returns `{ conversations, files, metadata }` |
| `splitLargeJson(jsonPath, outDir)` | helper to shard huge archives | *(planned)*                                  |
| `toMarkdown(conversation)`         | convert a chat to MD          | *(planned)*                                  |

### Return Types

```typescript
interface ExportData {
  conversations: ParsedConversation[];
  files: string[];
  metadata: {
    user?: any;
    messageFeedback?: any;
    modelComparisons?: any;
    sharedConversations?: any;
  };
}

interface ParsedConversation {
  id: string;
  title: string;
  createTime: Date;
  updateTime: Date;
  messages: ParsedMessage[];
  isArchived: boolean;
  safeUrls: string[];
}

interface ParsedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createTime: Date;
  metadata: Record<string, any>;
}
```

## Example

```js
import { parseExport } from 'chatgpt-export-parser';

async function analyzeMyChats() {
  const data = await parseExport('./my-chatgpt-export.zip');
  
  console.log(`Found ${data.conversations.length} conversations`);
  
  // Find longest conversation
  const longest = data.conversations.reduce((a, b) => 
    a.messages.length > b.messages.length ? a : b
  );
  
  console.log(`Longest conversation: "${longest.title}" with ${longest.messages.length} messages`);
  
  // Get all user messages
  const userMessages = longest.messages.filter(msg => msg.role === 'user');
  console.log(`You sent ${userMessages.length} messages in this conversation`);
}
```

## Development

```bash
npm install
npm test
npm run build
```

## Roadmap

* [x] Basic ZIP parsing and conversation extraction
* [x] TypeScript types and interfaces
* [x] Message reconstruction from mapping tree
* [ ] Stream parser for >1 GB exports
* [ ] CLI (`chatgpt-export <zip> --markdown`)
* [ ] Project‑aware grouping once OpenAI exposes it
* [ ] Tests against multiple export versions

## Contributing

PRs welcome! Drop issues if the schema shifts.

## License

MIT (or similar) – see `LICENSE` file.
