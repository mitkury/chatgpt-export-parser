"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedConversationsSchema = exports.ModelComparisonsSchema = exports.MessageFeedbackSchema = exports.UserSchema = exports.ChatGPTExportSchema = exports.ConversationSchema = exports.NodeSchema = exports.MessageSchema = exports.ContentSchema = exports.AuthorSchema = void 0;
exports.validateConversations = validateConversations;
exports.validateUser = validateUser;
exports.validateMessageFeedback = validateMessageFeedback;
exports.validateModelComparisons = validateModelComparisons;
exports.validateSharedConversations = validateSharedConversations;
const zod_1 = require("zod");
// Author schema for message authors
exports.AuthorSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'assistant', 'system', 'tool']),
    name: zod_1.z.string().nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
});
// Content schema for message content
exports.ContentSchema = zod_1.z.object({
    content_type: zod_1.z.string().default('text'),
    parts: zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.record(zod_1.z.string(), zod_1.z.unknown())])).optional(),
});
// Message schema for individual messages
exports.MessageSchema = zod_1.z.object({
    id: zod_1.z.string(),
    author: exports.AuthorSchema,
    create_time: zod_1.z.number().nullable(),
    update_time: zod_1.z.number().nullable().optional(),
    content: exports.ContentSchema,
    status: zod_1.z.string().optional(),
    end_turn: zod_1.z.boolean().nullable().optional(),
    weight: zod_1.z.number().optional(),
    recipient: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).default({}),
});
// Node schema for conversation mapping nodes
exports.NodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    parent: zod_1.z.string().nullable().optional(),
    children: zod_1.z.array(zod_1.z.string()),
    message: exports.MessageSchema.nullable().optional(),
});
// Conversation schema for individual conversations
exports.ConversationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().nullable(),
    create_time: zod_1.z.number(),
    update_time: zod_1.z.number(),
    current_node: zod_1.z.string(),
    is_archived: zod_1.z.boolean().optional(),
    moderation_results: zod_1.z.array(zod_1.z.unknown()).default([]),
    mapping: zod_1.z.record(zod_1.z.string(), exports.NodeSchema),
    plugin_ids: zod_1.z.array(zod_1.z.string()).nullable().optional(),
    conversation_template_id: zod_1.z.string().nullable().optional(),
    gizmo_id: zod_1.z.string().nullable().optional(),
    safe_urls: zod_1.z.array(zod_1.z.string()).default([]),
});
// Export schema for the entire conversations.json file
exports.ChatGPTExportSchema = zod_1.z.array(exports.ConversationSchema);
// Metadata schemas for other files
exports.UserSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown());
exports.MessageFeedbackSchema = zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()));
exports.ModelComparisonsSchema = zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()));
exports.SharedConversationsSchema = zod_1.z.array(zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()));
// Validation functions
function validateConversations(data) {
    return exports.ChatGPTExportSchema.parse(data);
}
function validateUser(data) {
    return exports.UserSchema.parse(data);
}
function validateMessageFeedback(data) {
    return exports.MessageFeedbackSchema.parse(data);
}
function validateModelComparisons(data) {
    return exports.ModelComparisonsSchema.parse(data);
}
function validateSharedConversations(data) {
    return exports.SharedConversationsSchema.parse(data);
}
//# sourceMappingURL=schema.js.map