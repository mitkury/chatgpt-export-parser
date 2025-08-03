# ChatGPT Data Export Format and Parsing

> **Status:** ✅ **Implemented** - We have a working parser in this repository that handles all the features described below. See the main README.md for usage examples.

## Export Archive Contents

When you use **ChatGPT's "Export Data"** feature, you receive a ZIP archive containing your entire chat history and related info in both HTML and JSON formats. The structure typically includes several files:

* **`chat.html`** – A single HTML file containing all conversations in a readable format. You can open this in a browser to scroll or use text search across your chats. (It's essentially an offline viewer of your chat history, though large files can be slow to load.)
* **`conversations.json`** – A JSON file that holds all your conversations with metadata. This is the primary source for structured data and is ideal for programmatic processing.
* **`message_feedback.json`** – Records of any feedback you gave (👍 or 👎 on answers). Each entry links a message ID and conversation ID with your rating and optional tags/notes.
* **`model_comparisons.json`** – Contains snippets of conversations for cases where you used the *"Regenerate response"* feature or compared models. It logs alternate responses and related metadata (without full titles).
* **`shared_conversations.json`** – If you generated shareable links for chats, this file lists those shared conversation IDs and metadata (title, timestamps, etc.).
* **`user.json`** – Basic account info, such as your user ID, email, whether you're a Plus user, and phone number.

*(Depending on when the export was generated, you might see slight variations. For example, older exports may not include `shared_conversations.json` if the share feature was unused or unavailable. But in general, the above files cover the key data.)*

## Our Implementation

We've implemented a comprehensive parser that handles all these files:

```typescript
import { parseExport } from 'chatgpt-export-parser';

const data = await parseExport('ChatGPT-data.zip');

// Access all parsed data
console.log(`${data.conversations.length} conversations`);
console.log(`${data.files.length} files in archive`);
console.log('User data:', data.metadata.user);
console.log('Feedback:', data.metadata.messageFeedback);
```

## Schema of **`conversations.json`**

The **`conversations.json`** file is a structured JSON array, where each element is an object representing one conversation. Each conversation object contains high-level attributes and an embedded message tree. Important top-level fields you'll commonly see include:

* **`id`** – The conversation's unique identifier (UUID string).
* **`title`** – The title of the conversation (ChatGPT auto-generates this from the first prompt, unless manually renamed).
* **`create_time`** – Timestamp (Unix epoch in seconds, as a float) when the conversation was started.
* **`update_time`** – Timestamp of the last update (last message) in the conversation. Useful for sorting chats chronologically.
* **`is_archived`** – Boolean flag indicating if the user archived this conversation in the UI (archived chats are hidden from the sidebar).
* **`moderation_results`** – An array (often empty) reserved for any content moderation flags or results for the conversation.
* **`current_node`** – The ID of the most recent message node in the conversation. This serves as a pointer to the end of the conversation thread.
* **`mapping`** – **The message tree**. This is a JSON object mapping each message node ID to its content and relationship info. The structure of `mapping` is described in detail below.
* **`plugin_ids`** – If any ChatGPT plugins were used, this field lists their IDs. Otherwise it may be `null` or an empty list.
* **`conversation_template_id`** – Typically `null`; potentially a reserved field for system templates or conversation presets (not commonly used in normal chats).
* **`gizmo_id`** – Also usually `null`; another reserved field whose exact purpose isn't documented (possibly related to UI state or specialized conversations).
* **`safe_urls`** – An array of sanitized URLs (often empty). This may contain links to images or other media generated during the conversation (for example, images produced by the **Code Interpreter** or other plugins). These can be used to retrieve or reference those media files.

**Note:** The JSON schema evolved over time. New fields like `is_archived` and `safe_urls` were added in 2023 as features like chat archiving and image outputs were introduced. Always check for existence of fields (e.g. `conversation_id` vs `id`) and default values (`null` or empty arrays) to make your parser robust to slight changes.

### Message Mapping Structure

The **`mapping`** field contains the actual content of the conversation in a nested tree format. Each key in this object is a message **node ID** (a UUID string), and its value is an object with the following structure:

* **`id`** – The same ID of the node (repeated for convenience).

* **`message`** – *(Omitted for certain placeholder nodes)*. If present, this is an object representing the actual message at this node. It contains:

  * **`id`** – The message ID (usually identical to the node ID).
  * **`author`** – An object identifying who authored the message:

    * **`role`** – either `"user"`, `"assistant"`, `"system"`, or `"tool"`. `"user"` is your prompt, `"assistant"` is ChatGPT's reply, `"system"` is used for system-level instructions or context (including the hidden **custom instructions**), and `"tool"` is used for tool/plugin calls.
    * **`name`** – Usually `null`. (This could be used if the assistant had a custom name or for system messages labeling, but generally it's empty.)
    * **`metadata`** – Additional info about the author, often an empty object. (For system messages related to the custom instructions feature, metadata may include flags – see below.)
  * **`create_time`** – Timestamp when this message was created (floating-point Unix seconds).
  * **`update_time`** – Timestamp if the message was edited/updated. This is often `null` for most messages (unless you used the chat edit feature).
  * **`content`** – An object with the message content:

    * **`content_type`** – Typically `"text"` for standard messages. (Could differ if the message was e.g. an image or other format, but generally text.)
    * **`parts`** – An array of text segments or objects. Usually this is a single-element array containing the full message text, but can also contain complex objects for tool calls or structured content. (The API may split very long content into multiple parts, hence an array. In most cases, you can join these to get the complete message.)
  * **`status`** – Status of the message (a string). In final conversations this is often `"finished"` or omitted. During generation it can be `"in_progress"`, but the export likely only includes final states.
  * **`end_turn`** – Indicates if this message ended the turn. This is usually `true` for system messages or when the assistant has finished its answer, and `null` or `false` otherwise. (It helps the chat UI know when to allow the next user prompt.)
  * **`weight`** – A number (often `1` or `1.0` for all messages). This may be an internal weighting for system vs user messages. Typically you will see `1.0` for actual messages.
  * **`metadata`** – A dictionary of extra metadata about the message. This is often empty `{}` for user prompts. For assistant responses, it includes details like the model name and finish reason: e.g. `"model_slug": "text-davinci-002-render-sha"` and a `finish_details` object (with a `"type": "stop"` when the assistant completed naturally). If the conversation used function calls or plugins, their data might also appear here.

    * For *system messages* used by the **Custom Instructions** feature, you will see special fields: `"is_user_system_message": true` and a `user_context_message_data` object containing your custom instruction texts (your "About me" and "Writing style" info). In such a case, the system message's `content.parts` is often an empty string (the real content is in that metadata).
  * **`recipient`** – Usually `"all"`. This field might be relevant if messages were directed to a subset of participants (in multi-user chats or plugin contexts), but in ChatGPT it's typically `"all"`.

* **`parent`** – The ID of the parent node in the conversation tree. This links the message to the previous turn. For example, a user message's parent is often the assistant's prior answer, and vice-versa. The very first user message usually has a parent that is a special system or blank node (see below).

* **`children`** – An array of IDs of any child nodes (following messages). In a linear conversation, each message has at most one child (the next turn). However, if you *edited* a message or *regenerated* an answer, you may see multiple children from one node – representing branches. Only one branch is the "active" conversation (typically indicated by the `current_node` and by the lack of an `is_archived` flag on the message), while other branches are alternate unused paths.

**Conversation Start:** Typically, each conversation's mapping includes a **root node** that has no `parent` (or a `parent` pointing to a null/placeholder). Often this is a system message node with an empty `content` that serves as the starting point. For example, you might see a system message with `role: "system"` and empty content as the first node – this might represent the initial context (or just a placeholder). Its child will be your first user prompt. In the mapping, the root's `parent` may not be present or is a dummy UUID, and one can identify it because it isn't listed as anyone's child.

**Branches:** If you used *regenerate response* on an assistant answer, the user message node will have two children: one for the original assistant reply and one for the regenerated reply. Similarly, if you edited a user question, the assistant's previous answer might remain as an orphan branch. These alternate branches remain in the JSON. They can be identified because one of the children leads to the `current_node` (the conversation's final turn) while others do not. By default, ChatGPT's UI only shows the latest branch.

## Our Parser Implementation

Our parser handles all these complexities:

### Flat Message Arrays
```typescript
const conversation = data.conversations[0];
console.log(`${conversation.messages.length} messages`);

// Simple access to all messages
conversation.messages.forEach(msg => {
  console.log(`${msg.role}: ${msg.content}`);
});
```

### Tree Structure for Branches
```typescript
const tree = conversation.messageTree;
const traverseTree = (node) => {
  console.log(`${node.message.role}: ${node.message.content}`);
  node.children.forEach(traverseTree);
};
traverseTree(tree);
```

### Parent-Child Relationships
```typescript
conversation.messages.forEach(msg => {
  console.log(`Message ${msg.id}:`);
  console.log(`  Parent: ${msg.parentId || 'none'}`);
  console.log(`  Children: ${msg.childrenIds?.length || 0}`);
});
```

### Runtime Validation
Our parser uses Zod schemas to validate all data at runtime, ensuring:
- Data integrity
- Detailed error messages
- Type safety
- Graceful handling of null/optional fields

This implementation has been tested with real ChatGPT exports containing 2,500+ conversations and handles all the edge cases described above.
