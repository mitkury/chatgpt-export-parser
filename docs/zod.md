# ChatGPT Export Integration – Implementation

> **Status:** ✅ **Implemented** - We have working Zod schemas in `src/schema.ts` that validate ChatGPT exports at runtime.

## Overview

This document describes our **implemented** Zod schema design for validating ChatGPT export data. The schemas ensure data integrity and provide detailed error messages when validation fails.

## Implementation Details

### Schema Location
- **File:** `src/schema.ts`
- **Exports:** All schemas are exported for external use
- **Validation:** Runtime validation with detailed error messages

### Core Schemas

```typescript
// Author schema for message authors
export const AuthorSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  name: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).default({}),
});

// Content schema for message content
export const ContentSchema = z.object({
  content_type: z.string().default('text'),
  parts: z.array(z.union([z.string(), z.record(z.string(), z.unknown())])).optional(),
});

// Message schema for individual messages
export const MessageSchema = z.object({
  id: z.string(),
  author: AuthorSchema,
  create_time: z.number().nullable(),
  update_time: z.number().nullable().optional(),
  content: ContentSchema,
  status: z.string().optional(),
  end_turn: z.boolean().nullable().optional(),
  weight: z.number().optional(),
  recipient: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

// Node schema for conversation mapping nodes
export const NodeSchema = z.object({
  id: z.string(),
  parent: z.string().nullable().optional(),
  children: z.array(z.string()),
  message: MessageSchema.nullable().optional(),
});

// Conversation schema for individual conversations
export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  create_time: z.number(),
  update_time: z.number(),
  current_node: z.string(),
  is_archived: z.boolean().optional(),
  moderation_results: z.array(z.unknown()).default([]),
  mapping: z.record(z.string(), NodeSchema),
  plugin_ids: z.array(z.string()).nullable().optional(),
  conversation_template_id: z.string().nullable().optional(),
  gizmo_id: z.string().nullable().optional(),
  safe_urls: z.array(z.string()).default([]),
});

// Main export schema
export const ChatGPTExportSchema = z.array(ConversationSchema);
```

### Validation Functions

```typescript
// Validate conversations array
export const validateConversations = (data: unknown) => 
  ChatGPTExportSchema.parse(data);

// Validate user metadata
export const validateUser = (data: unknown) => 
  UserSchema.parse(data);

// Validate message feedback
export const validateMessageFeedback = (data: unknown) => 
  MessageFeedbackSchema.parse(data);

// Validate model comparisons
export const validateModelComparisons = (data: unknown) => 
  ModelComparisonSchema.parse(data);

// Validate shared conversations
export const validateSharedConversations = (data: unknown) => 
  SharedConversationSchema.parse(data);
```

## Key Features

### ✅ **Runtime Validation**
- Validates all ChatGPT export data at runtime
- Catches data format issues early with detailed error messages
- Ensures our TypeScript types match actual data

### ✅ **Flexible Content Handling**
- Supports both string and object content parts
- Handles nullable fields gracefully
- Provides sensible defaults for optional fields

### ✅ **Error Reporting**
- Detailed error messages with exact paths
- Helps debug issues with malformed exports
- Validates against real ChatGPT export data

### ✅ **Type Safety**
- Zod schemas infer TypeScript types
- Full type safety throughout the API
- Exported types match validation schemas

## Usage

```typescript
import { validateConversations } from 'chatgpt-export-parser';

// Validate raw JSON data
const rawData = JSON.parse(fs.readFileSync('conversations.json', 'utf8'));
const conversations = validateConversations(rawData);

// TypeScript knows this is ConversationExport[]
console.log(`Found ${conversations.length} conversations`);
```

## Error Handling

```typescript
import { validateConversations } from 'chatgpt-export-parser';

try {
  const conversations = validateConversations(rawData);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors);
    // Error includes exact path and expected vs received values
  }
}
```

## Schema Evolution

The schemas are designed to handle:
- **Null values** - Many fields can be null in real exports
- **Optional fields** - Graceful handling of missing data
- **Content variations** - Both string and object content parts
- **Future changes** - Extensible for new ChatGPT export features

This implementation has been tested with real ChatGPT exports containing 2,500+ conversations and handles all edge cases we've encountered.
