# Practical TypeScript tips

```ts
// Minimal schema for a chat inside conversations.json
export interface ChatExport {
  id: string;
  title: string;
  create_time: number;   // Unix epoch seconds
  update_time: number;
  mapping: Record<string, ChatChunk>;
}

export interface ChatChunk {
  id: string;
  message?: ChatMessage;       // undefined for deleted/placeholder chunks
  parent?: string;             // link to previous chunk
  children: string[];
}

export interface ChatMessage {
  author: { role: 'system' | 'user' | 'assistant' };
  content: { content_type: 'text' | 'image'; parts: string[] };
  create_time: number;
  end_turn: boolean;
  metadata: unknown;
}
```
