# ChatGPT Export Parser JS

Turn **ChatGPT data‑export ZIPs** into easy‑to‑use JavaScript objects with full support for branched conversations.

> **Status:** ✅ Production Ready — Successfully parses ChatGPT export archives with comprehensive branch handling, Zod validation, and TypeScript support.

---

## Why?

OpenAI's export gives you a single ZIP with `conversations.json`, files, feedback logs, etc. This library unwraps that archive and surfaces:

* `conversations[]` – list of chats (title, timestamps, id…).
* `conversation.messages[]` – ordered turns (`user` / `assistant` / `system` / `tool`).
* **Branched conversations** – full tree structure with parent-child relationships.
* **Runtime validation** – Zod schemas ensure data integrity.
* Attachments & safe URLs (when present).

All as plain JS objects or typed data (TS). Perfect for analysis, search, re‑publishing your own archive, or importing into alternative ChatGPT clients.

## Install

```bash
npm install chatgpt-export-parser
```

## Quick start

```js
import { parseExport } from 'chatgpt-export-parser';

const data = await parseExport('ChatGPT-data.zip');

// Simple: Access all messages as flat array
const conversation = data.conversations[0];
console.log(`${conversation.messages.length} messages`);

// Advanced: Work with conversation tree
const tree = conversation.messageTree;
console.log(`Tree has ${tree.children.length} branches`);
```

## API

### Core Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `parseExport(zipPath)` | Parse ChatGPT export archive | `ExportData` |
| `validateConversations(data)` | Validate conversation data | `ConversationExport[]` |
| `validateUser(data)` | Validate user metadata | `UserData` |

### Return Types

```typescript
interface ExportData {
  conversations: ParsedConversation[];
  files: string[];
  metadata: {
    user?: UserData;
    messageFeedback?: MessageFeedback[];
    modelComparisons?: ModelComparison[];
    sharedConversations?: SharedConversation[];
  };
}

interface ParsedConversation {
  id: string;
  title: string | null;
  createTime: Date;
  updateTime: Date;
  // Flat array of all messages (current branch + all branches)
  messages: ParsedMessage[];
  // Tree structure for advanced branch handling
  messageTree?: MessageTree;
  // Branch information
  branches?: ConversationBranch[];
  // Original mapping for advanced use cases
  originalMapping?: Record<string, MessageNode>;
  isArchived: boolean;
  safeUrls: string[];
}

interface ParsedMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  createTime: Date;
  metadata: Record<string, unknown>;
  // Branching information
  parentId?: string;
  childrenIds?: string[];
  branchId?: string;
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

### Working with Branched Conversations

```js
import { parseExport } from 'chatgpt-export-parser';

async function exploreBranches() {
  const data = await parseExport('./my-chatgpt-export.zip');
  
  // Find conversations with branches
  const branchedConversations = data.conversations.filter(conv => 
    conv.messageTree && conv.messageTree.children.length > 0
  );
  
  console.log(`Found ${branchedConversations.length} conversations with branches`);
  
  // Traverse conversation tree
  const traverseTree = (node) => {
    console.log(`${node.message.role}: ${node.message.content.substring(0, 50)}...`);
    node.children.forEach(traverseTree);
  };
  
  branchedConversations.forEach(conv => {
    console.log(`\nConversation: "${conv.title}"`);
    traverseTree(conv.messageTree);
  });
}
```

### Advanced: Working with Original Mapping

```js
import { parseExport } from 'chatgpt-export-parser';

async function advancedAnalysis() {
  const data = await parseExport('./my-chatgpt-export.zip');
  
  const conversation = data.conversations[0];
  
  // Access original ChatGPT mapping structure
  const mapping = conversation.originalMapping;
  
  // Find all nodes with multiple children (branch points)
  const branchPoints = Object.values(mapping).filter(node => 
    node.children && node.children.length > 1
  );
  
  console.log(`Found ${branchPoints.length} branch points in conversation`);
}
```

## Features

### ✅ **Comprehensive Branch Support**
- **Flat arrays** for simple processing
- **Tree structures** for advanced branch handling
- **Parent-child relationships** preserved
- **Virtual root nodes** for multiple conversation roots

### ✅ **Runtime Validation**
- **Zod schemas** ensure data integrity
- **Detailed error messages** for debugging
- **Type safety** throughout the API

### ✅ **Full Fidelity**
- **All message types** (user, assistant, system, tool)
- **Rich metadata** preserved
- **Original mapping** accessible
- **Safe URLs** and attachments

### ✅ **Production Ready**
- **TypeScript support** with full type definitions
- **Comprehensive tests** with real ChatGPT exports
- **Error handling** for malformed data
- **Performance optimized** for large exports

## Development

```bash
npm install
npm test          # Run tests
npm run test:run  # Run tests without watch mode
npm run build     # Build TypeScript
```

## Roadmap

* [x] Basic ZIP parsing and conversation extraction
* [x] TypeScript types and interfaces
* [x] Message reconstruction from mapping tree
* [x] **Branched conversation support**
* [x] **Runtime validation with Zod**
* [x] **Tree structure for advanced use cases**
* [ ] Stream parser for >1 GB exports
* [ ] CLI (`chatgpt-export <zip> --markdown`)
* [ ] Project‑aware grouping once OpenAI exposes it
* [ ] Tests against multiple export versions

## Contributing

PRs welcome! Drop issues if the schema shifts.

## License

MIT (or similar) – see `LICENSE` file.
