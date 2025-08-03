import { z } from 'zod';

// Author schema for message authors
export const AuthorSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  name: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
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

// Export schema for the entire conversations.json file
export const ChatGPTExportSchema = z.array(ConversationSchema);

// Metadata schemas for other files
export const UserSchema = z.record(z.string(), z.unknown());
export const MessageFeedbackSchema = z.array(z.record(z.string(), z.unknown()));
export const ModelComparisonsSchema = z.array(z.record(z.string(), z.unknown()));
export const SharedConversationsSchema = z.array(z.record(z.string(), z.unknown()));

// Type exports
export type Author = z.infer<typeof AuthorSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ChatGPTExport = z.infer<typeof ChatGPTExportSchema>;

// Validation functions
export function validateConversations(data: unknown): Conversation[] {
  return ChatGPTExportSchema.parse(data);
}

export function validateUser(data: unknown): Record<string, any> {
  return UserSchema.parse(data);
}

export function validateMessageFeedback(data: unknown): Record<string, any>[] {
  return MessageFeedbackSchema.parse(data);
}

export function validateModelComparisons(data: unknown): Record<string, any>[] {
  return ModelComparisonsSchema.parse(data);
}

export function validateSharedConversations(data: unknown): Record<string, any>[] {
  return SharedConversationsSchema.parse(data);
} 