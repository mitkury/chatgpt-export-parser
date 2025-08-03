# ChatGPT Export Integration – Developer Spec

> **Note:** This document describes the planned Zod schema design. We have implemented working Zod schemas in `src/schema.ts` that validate ChatGPT exports at runtime.

> **Goal** — Provide a reusable Node‑friendly package that ingests a user‑downloaded ChatGPT export ZIP, validates it with Zod, and exposes a clean runtime API **plus** an optional CLI.

---

## 1. Technical Stack

| Layer        | Choice                             | Rationale                                                              |
| ------------ | ---------------------------------- | ---------------------------------------------------------------------- |
| Language     | **TypeScript 5.x** (target ES2020) | Strict typing, native top‑level await, keeps the Zod schema ergonomic. |
| Runtime      | **Node ≥ 18**                      | Built‑in fetch & stream promises; wide LTS coverage.                   |
| Validation   | **Zod >= 3.22**                    | Zero‑dependency runtime schema validation & type inference.            |
| ZIP handling | **unzipper** (stream‑based)        | Works purely in JS, no native deps.                                    |
| Testing      | **Vitest**                         | Fast, watch‑mode, ESM‑friendly.                                        |
| Lint/Format  | eslint + prettier                  | Standard.                                                              |

---

## 2. Directory / Module Layout

```
chatgpt-export-kit/
├── package.json
├── tsconfig.json
├── src/
│   ├── schema/
│   │   └── chatgptExportSchema.ts      ← Zod schema & helpers
│   ├── utils/
│   │   └── unzip.ts                    ← stream‑based extractor
│   ├── index.ts                        ← main public API
│   └── cli.ts                          ← optional CLI entry
└── test/
    └── integration.spec.ts
```

---

## 3. Zod Schema (`src/schema/chatgptExportSchema.ts`)

> **Source of truth** – keep any downstream types re‑exported from here.

```ts
import { z } from "zod";

export const AuthorSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool"]).or(z.string()),
  name: z.string().nullable().optional(),
  metadata: z.record(z.any()).default({}),
});

export const ContentSchema = z.object({
  content_type: z.string().default("text"),
  parts: z.array(z.string()),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  author: AuthorSchema,
  create_time: z.number().nullable().optional(),
  update_time: z.number().nullable().optional(),
  content: ContentSchema,
  status: z.string().optional(),
  end_turn: z.boolean().nullable().optional(),
  weight: z.number().optional(),
  recipient: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const NodeSchema = z.object({
  id: z.string().uuid(),
  parent: z.string().uuid().nullable(),
  children: z.array(z.string().uuid()),
  message: MessageSchema.nullable(),
});

export const ConversationSchema = z.object({
  title: z.string(),
  create_time: z.number(),
  update_time: z.number().nullable().optional(),
  current_node: z.string().uuid().optional(),
  mapping: z.record(NodeSchema),
  moderation_results: z.any().optional(),
  plugin_ids: z.array(z.string()).optional(),
  conversation_id: z.string().optional(),
  client_id: z.string().optional(),
  server_id: z.string().optional(),
});

export const ChatGPTExportSchema = z.union([
  z.array(ConversationSchema),
  z.object({ conversations: z.array(ConversationSchema) }),
]);

/** Flatten mapping ➜ ordered message array */
export const flattenConversation = (
  conv: z.infer<typeof ConversationSchema>,
): z.infer<typeof MessageSchema>[] =>
  Object.values(conv.mapping)
    .filter((n) => n.message)
    .sort(
      (a, b) => (a.message!.create_time ?? 0) - (b.message!.create_time ?? 0),
    )
    .map((n) => n.message!);

export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
```

---

## 4. Unzip Utility (`src/utils/unzip.ts`)

```ts
import fs from "node:fs";
import path from "node:path";
import unzipper from "unzipper";

/** Extract all files OR just a whitelist into `destDir`. */
export async function extractZip(
  zipPath: string,
  destDir: string,
  filter: (entryPath: string) => boolean = () => true,
): Promise<string[]> {
  const extracted: string[] = [];
  await fs
    .createReadStream(zipPath)
    .pipe(unzipper.Parse())
    .on("entry", async (entry: unzipper.Entry) => {
      if (entry.type === "File" && filter(entry.path)) {
        const p = path.join(destDir, entry.path);
        await fs.promises.mkdir(path.dirname(p), { recursive: true });
        extracted.push(p);
        entry.pipe(fs.createWriteStream(p));
      } else {
        entry.autodrain();
      }
    })
    .promise();
  return extracted;
}
```

---

## 5. Public API (`src/index.ts`)

```ts
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { extractZip } from "./utils/unzip";
import {
  ChatGPTExportSchema,
  flattenConversation,
  Conversation,
} from "./schema/chatgptExportSchema";

export interface LoadOptions {
  /** Validate with Zod (default: true) */
  validate?: boolean;
  /** Delete temp dir after parse (default: true) */
  cleanup?: boolean;
}

export async function loadExport(
  zipPath: string,
  opts: LoadOptions = {},
): Promise<Conversation[]> {
  const { validate = true, cleanup = true } = opts;

  if (!(await fs.stat(zipPath)).isFile())
    throw new Error(`File not found: ${zipPath}`);

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "chatgpt‑export‑"));
  await extractZip(zipPath, tempDir, (p) => p.endsWith("conversations.json"));

  // locate conversations.json (may be nested)
  const convPaths: string[] = [];
  const walk = async (dir: string) => {
    for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) await walk(full);
      else if (ent.name === "conversations.json") convPaths.push(full);
    }
  };
  await walk(tempDir);

  if (!convPaths.length)
    throw new Error("conversations.json not found inside the ZIP");

  const raw = JSON.parse(await fs.readFile(convPaths[0], "utf8"));
  const data = validate ? ChatGPTExportSchema.parse(raw) : raw;

  if (cleanup) await fs.rm(tempDir, { recursive: true, force: true });
  return Array.isArray(data) ? data : data.conversations;
}

/** Convenience: load → first conversation → flatten */
export async function loadFlatMessages(
  zipPath: string,
  opts: LoadOptions = {},
) {
  const [first] = await loadExport(zipPath, opts);
  if (!first) throw new Error("Export appears empty");
  return flattenConversation(first);
}
```

---

## 6. CLI (`src/cli.ts`)

```ts
#!/usr/bin/env node
import { loadExport } from "./index";
import { program } from "commander";
import fs from "node:fs";

program
  .name("chatgpt-export")
  .description("Validate & inspect ChatGPT export ZIPs")
  .argument("<zip>", "Path to export ZIP")
  .option("-o, --out <file>", "Write flattened JSON to <file>")
  .option("--no-validate", "Skip Zod validation")
  .action(async (zip, opts) => {
    const convs = await loadExport(zip, { validate: opts.validate });
    console.log(`✓ ${convs.length} conversations parsed`);
    if (opts.out) {
      fs.writeFileSync(opts.out, JSON.stringify(convs, null, 2));
      console.log(`Flattened JSON written to ${opts.out}`);
    }
  });

program.parse();
```

Publish the CLI by adding to `package.json`:

```json
"bin": {
  "chatgpt-export": "dist/cli.js"
}
```

---

## 7. Error Handling Matrix

| Stage      | Possible Issue | Throw / Exit Code | Suggested Message                          |
| ---------- | -------------- | ----------------- | ------------------------------------------ |
| File I/O   | Path not found | `ENOENT` (1)      | "File not found: …"                        |
| Unzip      | Invalid ZIP    | `EZIP` (2)        | "Cannot read ZIP – is the file corrupted?" |
| JSON       | Parse error    | `EJSON` (3)       | "Invalid conversations.json"               |
| Validation | ZodError       | `EVALID` (4)      | echo `error.errors` in pretty table        |

Use [`exit-code`](https://www.npmjs.com/package/exit-code) if you want constants.

---

## 8. Testing & CI

```bash
npm i -D vitest @types/node cross-env
```

* **unit:** schema round‑trip with fixture exports (small & malformed).
* **integration:** spawn CLI on fixture ZIP ➜ expect exit 0.

Add GitHub Actions matrix for Node 18, 20.

---

## 9. Extensibility Hooks

* **`transformMessage`** callback in `loadExport` options to rewrite roles/content on load.
* **Schema patching:** export `AuthorSchema`, `ContentSchema`, etc., so app code can `.extend()` them before parsing.
* **Streaming parser:** for huge exports, switch to `clarinet` + incremental validate.

---

## 10. License & Attribution

MIT.  Mention that ChatGPT trademarks belong to OpenAI; user is responsible for GDPR compliance when processing personal data.

---

➡️ **Hand‑off**: give this spec plus the sample code skeleton to your dev(s), run `npm init -y && npm i zod unzipper commander`, then copy–paste. In under an hour they’ll have a validated importer ready for downstream AI pipelines.
