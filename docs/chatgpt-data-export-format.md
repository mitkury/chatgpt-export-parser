# ChatGPT Data Export Format and Parsing

> **Note:** This document describes the ChatGPT export format. We have implemented a working parser in this repository that handles all the features described below. See the main README.md for usage examples.

## Export Archive Contents

When you use **ChatGPT’s “Export Data”** feature, you receive a ZIP archive containing your entire chat history and related info in both HTML and JSON formats. The structure typically includes several files:

* **`chat.html`** – A single HTML file containing all conversations in a readable format. You can open this in a browser to scroll or use text search across your chats. (It’s essentially an offline viewer of your chat history, though large files can be slow to load.)
* **`conversations.json`** – A JSON file that holds all your conversations with metadata. This is the primary source for structured data and is ideal for programmatic processing.
* **`message_feedback.json`** – Records of any feedback you gave (👍 or 👎 on answers). Each entry links a message ID and conversation ID with your rating and optional tags/notes.
* **`model_comparisons.json`** – Contains snippets of conversations for cases where you used the *“Regenerate response”* feature or compared models. It logs alternate responses and related metadata (without full titles).
* **`shared_conversations.json`** – If you generated shareable links for chats, this file lists those shared conversation IDs and metadata (title, timestamps, etc.).
* **`user.json`** – Basic account info, such as your user ID, email, whether you’re a Plus user, and phone number.

*(Depending on when the export was generated, you might see slight variations. For example, older exports may not include `shared_conversations.json` if the share feature was unused or unavailable. But in general, the above files cover the key data.)*

## Schema of **`conversations.json`**

The **`conversations.json`** file is a structured JSON array, where each element is an object representing one conversation. Each conversation object contains high-level attributes and an embedded message tree. Important top-level fields you’ll commonly see include:

* **`id`** – The conversation’s unique identifier (UUID string).
* **`title`** – The title of the conversation (ChatGPT auto-generates this from the first prompt, unless manually renamed).
* **`create_time`** – Timestamp (Unix epoch in seconds, as a float) when the conversation was started.
* **`update_time`** – Timestamp of the last update (last message) in the conversation. Useful for sorting chats chronologically.
* **`is_archived`** – Boolean flag indicating if the user archived this conversation in the UI (archived chats are hidden from the sidebar).
* **`moderation_results`** – An array (often empty) reserved for any content moderation flags or results for the conversation.
* **`current_node`** – The ID of the most recent message node in the conversation. This serves as a pointer to the end of the conversation thread.
* **`mapping`** – **The message tree**. This is a JSON object mapping each message node ID to its content and relationship info. The structure of `mapping` is described in detail below.
* **`plugin_ids`** – If any ChatGPT plugins were used, this field lists their IDs. Otherwise it may be `null` or an empty list.
* **`conversation_template_id`** – Typically `null`; potentially a reserved field for system templates or conversation presets (not commonly used in normal chats).
* **`gizmo_id`** – Also usually `null`; another reserved field whose exact purpose isn’t documented (possibly related to UI state or specialized conversations).
* **`safe_urls`** – An array of sanitized URLs (often empty). This may contain links to images or other media generated during the conversation (for example, images produced by the **Code Interpreter** or other plugins). These can be used to retrieve or reference those media files.

**Note:** The JSON schema evolved over time. New fields like `is_archived` and `safe_urls` were added in 2023 as features like chat archiving and image outputs were introduced. Always check for existence of fields (e.g. `conversation_id` vs `id`) and default values (`null` or empty arrays) to make your parser robust to slight changes.

### Message Mapping Structure

The **`mapping`** field contains the actual content of the conversation in a nested tree format. Each key in this object is a message **node ID** (a UUID string), and its value is an object with the following structure:

* **`id`** – The same ID of the node (repeated for convenience).

* **`message`** – *(Omitted for certain placeholder nodes)*. If present, this is an object representing the actual message at this node. It contains:

  * **`id`** – The message ID (usually identical to the node ID).
  * **`author`** – An object identifying who authored the message:

    * **`role`** – either `"user"`, `"assistant"`, or `"system"`. `"user"` is your prompt, `"assistant"` is ChatGPT’s reply, and `"system"` is used for system-level instructions or context (including the hidden **custom instructions**).
    * **`name`** – Usually `null`. (This could be used if the assistant had a custom name or for system messages labeling, but generally it’s empty.)
    * **`metadata`** – Additional info about the author, often an empty object. (For system messages related to the custom instructions feature, metadata may include flags – see below.)
  * **`create_time`** – Timestamp when this message was created (floating-point Unix seconds).
  * **`update_time`** – Timestamp if the message was edited/updated. This is often `null` for most messages (unless you used the chat edit feature).
  * **`content`** – An object with the message content:

    * **`content_type`** – Typically `"text"` for standard messages. (Could differ if the message was e.g. an image or other format, but generally text.)
    * **`parts`** – An array of text segments. Usually this is a single-element array containing the full message text. (The API may split very long content into multiple parts, hence an array. In most cases, you can join these to get the complete message.)
  * **`status`** – Status of the message (a string). In final conversations this is often `"finished"` or omitted. During generation it can be `"in_progress"`, but the export likely only includes final states.
  * **`end_turn`** – Indicates if this message ended the turn. This is usually `true` for system messages or when the assistant has finished its answer, and `null` or `false` otherwise. (It helps the chat UI know when to allow the next user prompt.)
  * **`weight`** – A number (often `1` or `1.0` for all messages). This may be an internal weighting for system vs user messages. Typically you will see `1.0` for actual messages.
  * **`metadata`** – A dictionary of extra metadata about the message. This is often empty `{}` for user prompts. For assistant responses, it includes details like the model name and finish reason: e.g. `"model_slug": "text-davinci-002-render-sha"` and a `finish_details` object (with a `"type": "stop"` when the assistant completed naturally). If the conversation used function calls or plugins, their data might also appear here.

    * For *system messages* used by the **Custom Instructions** feature, you will see special fields: `"is_user_system_message": true` and a `user_context_message_data` object containing your custom instruction texts (your “About me” and “Writing style” info). In such a case, the system message’s `content.parts` is often an empty string (the real content is in that metadata).
  * **`recipient`** – Usually `"all"`. This field might be relevant if messages were directed to a subset of participants (in multi-user chats or plugin contexts), but in ChatGPT it’s typically `"all"`.

* **`parent`** – The ID of the parent node in the conversation tree. This links the message to the previous turn. For example, a user message’s parent is often the assistant’s prior answer, and vice-versa. The very first user message usually has a parent that is a special system or blank node (see below).

* **`children`** – An array of IDs of any child nodes (following messages). In a linear conversation, each message has at most one child (the next turn). However, if you *edited* a message or *regenerated* an answer, you may see multiple children from one node – representing branches. Only one branch is the “active” conversation (typically indicated by the `current_node` and by the lack of an `is_archived` flag on the message), while other branches are alternate unused paths.

**Conversation Start:** Typically, each conversation’s mapping includes a **root node** that has no `parent` (or a `parent` pointing to a null/placeholder). Often this is a system message node with an empty `content` that serves as the starting point. For example, you might see a system message with `role: "system"` and empty content as the first node – this might represent the initial context (or just a placeholder). Its child will be your first user prompt. In the mapping, the root’s `parent` may not be present or is a dummy UUID, and one can identify it because it isn’t listed as anyone’s child.

**Branches:** If you used *regenerate response* on an assistant answer, the user message node will have two children: one for the original assistant reply and one for the regenerated reply. Similarly, if you edited a user question, the assistant’s previous answer might remain as an orphan branch. These alternate branches remain in the JSON. They can be identified because one of the children leads to the `current_node` (the conversation’s final turn) while others do not. By default, ChatGPT’s UI only shows the latest branch.

## Parsing and Reconstructing Conversations (TypeScript)

Because the export is pure JSON, you can parse `conversations.json` easily in TypeScript/JavaScript using standard methods (e.g. `JSON.parse` in Node or the browser). Below are some **best practices and tips** for extracting structured info and rebuilding threads:

### 1. Define TypeScript Interfaces

Start by defining interfaces to model the data. This makes it easier to work with the JSON in a type-safe way:

```ts
interface ConversationExport {
  title: string;
  create_time: number;
  update_time: number;
  id: string;
  current_node: string;
  is_archived: boolean;
  moderation_results: any[];
  mapping: Record<string, MessageNode>;
  plugin_ids: string[] | null;
  conversation_template_id: string | null;
  gizmo_id: string | null;
  safe_urls: string[]; 
}

interface MessageNode {
  id: string;
  parent?: string;
  children: string[];
  message?: MessageContent;
}

interface MessageContent {
  id: string;
  author: {
    role: "user" | "assistant" | "system";
    name: string | null;
    metadata: Record<string, any>;
  };
  create_time: number;
  update_time: number | null;
  content: {
    content_type: "text" | string;
    parts: string[];
  };
  status?: string;
  end_turn: boolean | null;
  weight: number;
  metadata: Record<string, any>;
  recipient: string;
}
```

*(The above schema is derived from observed export data and community reverse-engineering. You may adjust types as needed; for example, `status` and certain metadata fields can be optional.)*

Using interfaces or even a JSON schema can help validate the structure as you parse. Libraries like **Zod** or TypeScript’s built-in type checking can ensure the JSON matches the expected shape.

### 2. Loading the JSON Safely

For smaller exports, you can read the entire `conversations.json` file into memory and parse it. For example, in Node.js:

```ts
import * as fs from 'fs';

const data = fs.readFileSync('conversations.json', 'utf-8');
const conversations: ConversationExport[] = JSON.parse(data);
console.log(`Loaded ${conversations.length} conversations`);
```

However, if your history is very large (some users have JSON files over 100MB in size), consider streaming the parse to avoid high memory usage. You can use node libraries like **stream-json** or **JSONStream** to process the file incrementally. Another strategy is to split the file upfront – the JSON is an array of conversations, so you could carve it into smaller chunks (or use a tool that splits on each top-level array element).

One open-source utility, for example, provides a Python script to split a big `conversations.json` into individual files per conversation for easier handling. You could implement a similar approach in TypeScript: read the file, decode it as a stream, and write out each conversation object to its own JSON file. This makes searching or loading a specific chat more manageable.

### 3. Reconstructing a Conversation Thread

To present a conversation (e.g. to convert it to Markdown or to display in a UI), you need to traverse the `mapping` tree in the correct order. The **recommended approach** is to use the `current_node` as the endpoint and walk backwards via parent pointers to the root:

```ts
function getConversationMessages(conv: ConversationExport) {
  const messages: MessageContent[] = [];
  let nodeId: string | undefined = conv.current_node;
  while (nodeId) {
    const node = conv.mapping[nodeId];
    if (!node) break;  // safety check
    if (node.message) {
      messages.push(node.message);
    }
    nodeId = node.parent;  // move to parent node
  }
  messages.reverse();  // reverse to chronological order from start to end
  return messages;
}
```

This will give you an array of `MessageContent` objects from the beginning system message (if any) through each user and assistant turn, up to the last reply. We collect backwards from the tail because each node has a pointer to its parent. Reversing it yields the conversation in forward order.

**Why this works:** In a normal linear chat, this simply follows the chain. In case of branches, the `current_node` lies on the “active” branch (the one that continued). So walking parents naturally stays on that branch. Any sibling nodes (alternate responses or edits not taken) won’t be encountered by this traversal. They will be ignored, which is usually what you want when reconstructing the main thread. (If you *do* want to include alternate paths, you would need to traverse the `children` arrays and perhaps enumerate or label branches – a more complex process.)

Using the above function, you can then format messages. For example:

```ts
for (const msg of getConversationMessages(conv)) {
  const role = msg.author.role;
  const text = msg.content.parts.join("");  // (join parts into full text)
  console.log(`${role.toUpperCase()}: ${text}\n`);
}
```

This would print the conversation as alternating “USER:” and “ASSISTANT:” lines, for instance. If you need timestamps, you can convert the `create_time` (seconds since epoch) to a readable date/time. Keep in mind all times are likely in UTC by default.

### 4. Handling Special Cases

Be aware of a few quirks in the data when parsing:

* **Empty system message:** Often the first node is a system message with empty content (used internally for context or instructions). You might want to skip printing this if it has no useful content. However, if it contains custom instructions metadata (`is_user_system_message`), you might extract that to understand the conversation’s context (e.g., the user had specific instructions in effect).
* **Images and files:** If the assistant provided images (e.g. via a plugin or the Vision/Multimodal features), those may not appear as base64 in the JSON. Instead, you might find placeholders or references. The `safe_urls` list could contain the actual file URLs (which might be expiring links). In `content.parts`, the assistant might have provided a markdown image tag or some reference text. Reconstructing these may require additional steps (such as correlating to files in the zip or fetching the URL). Community tools currently handle this case in a limited way – for example, one converter assumes all content is Markdown and doesn’t automatically embed images.
* **Code Interpreter outputs:** If you used the *Advanced Data Analysis* (formerly Code Interpreter) beta, the JSON will include your uploaded files and the assistant’s outputs. They may appear as system or assistant messages with content like “Uploaded file: <filename>” or “**Plot**: \<image.png>”. The actual files (images, CSVs, etc.) you uploaded or the AI generated might be included in the export (possibly as additional files or as base64 within `parts` if small). Be prepared to handle these. (They might come with an entry in `safe_urls` or simply as text references in the conversation.)
* **Plugins and Tools:** Similarly, when ChatGPT uses a tool or plugin (e.g. browsing, DALL·E), the conversation might include special system messages like “Searching for: …” or “Image generated: …”. These are stored as messages with roles `"assistant"` or `"system"`. They often have structured content (like a JSON payload for search results, or an image link). For parsing, you might just treat them as additional assistant turns. If needed, you can detect them via metadata (for example, `message.metadata.message_type` might indicate a tool invocation). Some community parsers have added custom formatting for these (e.g. formatting search results or canvas content in Markdown).

### 5. Leveraging Existing Tools and Libraries

While you can write a custom parser from scratch, it’s worth knowing about community projects that tackled this problem. They can provide guidance or even ready-to-use solutions:

* **ChatGPT to Markdown converters:** Several open-source scripts convert the exported JSON into Markdown or other formats. For example, *chatgpt-history-export-to-md* by mohamed-chs will read your JSON and output each conversation as a Markdown file (with front-matter for metadata). This script is written in Python, but you can read its logic for hints on ordering messages and handling edits. Another project, *ChatGPTConverter*, uses a shell script and an HTML template to turn the JSON into Markdown, which might then be saved via a browser. These tools demonstrate how to iterate through `mapping` and format each turn (and they typically ignore or simplify system messages, etc.). You can adapt similar logic in TypeScript.

* **ChatGPT JSON viewers:** Some community-built viewers let you load the export in a browser for search or navigation. For instance, one Reddit user built a web tool called **convconv** (convconv.abiro.com) that parses `conversations.json` and displays a list of titles and chats for browsing. There’s also *GPT View* (gptview\.tech, a Japanese project) which reads the JSON locally in your browser and provides search functionality. These projects are often client-side JavaScript – you may find their source code (or browser bundle) for inspiration on parsing in TS/JS. They generally parse the JSON, then create DOM elements for each conversation, showing messages in order.

* **CLI analysis tools:** The **Conversation Tree Toolkit (ctk)** is a Python CLI that can ingest ChatGPT exports and do things like search by regex, filter by date, and even merge or export in different formats. While it’s Python, its approach to reading the JSON and walking the tree could inform your TypeScript implementation. For instance, it likely identifies the linear thread similarly and provides queries on the data structure.

* **Reverse-engineering references:** The GitHub repo *everything-chatgpt* and various forum posts have documented the JSON structure (which we summarized above). They can be useful if you encounter a field you’re unsure about. For example, if OpenAI updates the format (as they did when introducing *ChatGPT Canvas* or other features), the community forums often discuss the changes. Keep an eye out for threads like *“Export format has changed”* – these can highlight new quirks (the ChatKeeper changelog noted that early exports of the Canvas feature had bugs, which were later fixed).

**Tip:** When writing your parser, test it on a small known JSON (perhaps export a single conversation) to ensure you correctly traverse and reconstruct messages. Then try it on your full archive. If performance is an issue with large files, consider processing one conversation at a time (streaming the JSON array) or offloading heavy tasks (like rendering Markdown) to separate steps.

### 6. Example – Combining Everything

Putting it together, here’s a conceptual snippet in TypeScript that reads the export and produces a simplified Markdown for each conversation (user prompts prefixed with **>**, assistant responses plain):

```ts
import * as fs from 'fs';

const data = fs.readFileSync('conversations.json', 'utf-8');
const conversations: ConversationExport[] = JSON.parse(data);

for (const convo of conversations) {
  console.log(`# ${convo.title}\n`);
  const msgs = getConversationMessages(convo);
  for (const msg of msgs) {
    const role = msg.author.role;
    const text = msg.content.parts.join("");
    if (role === "user") {
      console.log(`**User:** ${text}\n`);
    } else if (role === "assistant") {
      console.log(`**Assistant:** ${text}\n`);
    }
    // (You could handle system messages or others if needed)
  }
  console.log(`\n--- End of conversation ---\n\n`);
}
```

This would print out each conversation with a title and the dialogue in order. In a real application, you might write these to `.md` files instead of console, and you’d likely refine the formatting (e.g. preserve Markdown formatting present in the conversation, include timestamps or separators, etc.).

## Final Notes

Parsing ChatGPT’s export is made easier by the fact that it’s **structured JSON** and not an opaque format. The schema – while nested – is consistent, and community explorations have mapped it out completely. By leveraging TypeScript’s typing and following the parent/child links, you can reliably reconstruct each conversation thread in order.

Do keep in mind any **limitations** or **quirks**: for instance, exports might not include images themselves (only references), and very new features may introduce new fields. Always test your parser after major ChatGPT updates. The good news is many people in the OpenAI community have built tools for this, so there’s a wealth of examples. Using those as a reference, you can build a robust TypeScript parser that turns your `conversations.json` into whatever format or analysis you need – be it Markdown archives, searchable databases, or visualizations of your chat history.

**Sources:** The information above is drawn from community reverse-engineering of the ChatGPT export format and example projects that handle ChatGPT data exports, including official help articles and open-source tools. These resources document the JSON schema (message structures, timestamps, roles) and offer insights into processing the data for practical use.
