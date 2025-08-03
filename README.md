# ChatGPT Export Parser JS

Turn **ChatGPT data‑export ZIPs** into easy‑to‑use JavaScript objects with full support for branched conversations.

> **Status:** ✅ **Production Ready** — Handles all ChatGPT export features including branched conversations, tool messages, and runtime validation.

---

## Why?

OpenAI's export gives you a single ZIP with `conversations.json`, files, feedback logs, etc. This library unwraps that archive and surfaces:

* `conversations[]` – list of chats (title, timestamps, id…).
* `conversation.messages[]` – ordered turns (`user` / `assistant` / `system` / `tool`).
* `conversation.messageTree` – hierarchical tree structure for branched conversations.
* `conversation.branches[]` – identified conversation branches and their relationships.
* Attachments & safe URLs (when present).

All as plain JS objects or typed data (TS). Perfect for analysis, search, or re‑publishing your own archive.

## Install

```bash
npm install chatgpt-export-parser  # package name TBD
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
| `parseExport(zipPath \| Buffer)`   | returns `{ conversations, files, metadata }` |
| `splitLargeJson(jsonPath, outDir)` | helper to shard huge archives |                                              |
| `toMarkdown(conversation)`         | convert a chat to MD          |                                              |

### Types

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
  title: string | null;
  createTime: Date;
  updateTime: Date;
  messages: ParsedMessage[];           // Flat array of all messages
  messageTree?: MessageTree;           // Hierarchical tree structure
  branches?: ConversationBranch[];     // Identified conversation branches
  originalMapping?: Record<string, MessageNode>; // Original ChatGPT mapping
  isArchived: boolean;
  safeUrls: string[];
}

interface ParsedMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createTime: Date;
  metadata: Record<string, unknown>;
  parentId?: string;                   // Parent message ID
  childrenIds?: string[];              // Child message IDs
  branchId?: string;                   // Branch this message belongs to
}

interface MessageTree {
  id: string;
  message: ParsedMessage;
  parent?: MessageTree;
  children: MessageTree[];
  branchId: string;
}

interface ConversationBranch {
  id: string;
  messages: ParsedMessage[];
  startTime: Date;
  endTime: Date;
  parentBranchId?: string;
  childrenBranchIds: string[];
}
```

## Examples

### Basic Usage

```typescript
import { parseExport } from 'chatgpt-export-parser';

const data = await parseExport('ChatGPT-data.zip');

// Access all conversations
data.conversations.forEach(conv => {
  console.log(`Conversation: ${conv.title}`);
  console.log(`Messages: ${conv.messages.length}`);
  console.log(`Branches: ${conv.branches?.length || 0}`);
});
```

### Branched Conversations

```typescript
// Get all messages including branches
const conversation = data.conversations[0];

// Flat array of all messages (current + branches)
conversation.messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
  if (msg.parentId) {
    console.log(`  Parent: ${msg.parentId}`);
  }
});

// Tree structure for advanced navigation
const tree = conversation.messageTree;
const traverseTree = (node: MessageTree) => {
  console.log(`${node.message.role}: ${node.message.content}`);
  node.children.forEach(traverseTree);
};
traverseTree(tree);

// Branch information
conversation.branches?.forEach(branch => {
  console.log(`Branch ${branch.id}: ${branch.messages.length} messages`);
  console.log(`  Time: ${branch.startTime} to ${branch.endTime}`);
});
```

### Original Mapping Access

```typescript
// Access the original ChatGPT mapping structure
const originalMapping = conversation.originalMapping;
Object.entries(originalMapping).forEach(([id, node]) => {
  console.log(`Node ${id}:`);
  console.log(`  Parent: ${node.parent || 'none'}`);
  console.log(`  Children: ${node.children.length}`);
  if (node.message) {
    console.log(`  Role: ${node.message.author.role}`);
  }
});
```

## Development

```bash
npm install
npm run build
npm test
```

## Roadmap

* [x] ✅ Basic parser for ChatGPT exports
* [x] ✅ Zod runtime validation
* [x] ✅ Branched conversation support
* [x] ✅ Tree structure and branch identification
* [x] ✅ TypeScript types and exports
* [ ] Stream parser for >1 GB exports
* [ ] CLI (`chatgpt-export <zip> --markdown`)
* [ ] Project‑aware grouping once OpenAI exposes it
* [ ] Tests against multiple export versions

## Contributing

PRs welcome! Drop issues if the schema shifts.

## License

MIT - see `LICENSE` file.
