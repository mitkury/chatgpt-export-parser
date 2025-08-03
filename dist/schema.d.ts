import { z } from 'zod';
export declare const AuthorSchema: z.ZodObject<{
    role: z.ZodEnum<{
        user: "user";
        assistant: "assistant";
        system: "system";
        tool: "tool";
    }>;
    name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const ContentSchema: z.ZodObject<{
    content_type: z.ZodDefault<z.ZodString>;
    parts: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>>;
}, z.core.$strip>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    author: z.ZodObject<{
        role: z.ZodEnum<{
            user: "user";
            assistant: "assistant";
            system: "system";
            tool: "tool";
        }>;
        name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>;
    create_time: z.ZodNullable<z.ZodNumber>;
    update_time: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    content: z.ZodObject<{
        content_type: z.ZodDefault<z.ZodString>;
        parts: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>>;
    }, z.core.$strip>;
    status: z.ZodOptional<z.ZodString>;
    end_turn: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
    weight: z.ZodOptional<z.ZodNumber>;
    recipient: z.ZodOptional<z.ZodString>;
    metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const NodeSchema: z.ZodObject<{
    id: z.ZodString;
    parent: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    children: z.ZodArray<z.ZodString>;
    message: z.ZodOptional<z.ZodNullable<z.ZodObject<{
        id: z.ZodString;
        author: z.ZodObject<{
            role: z.ZodEnum<{
                user: "user";
                assistant: "assistant";
                system: "system";
                tool: "tool";
            }>;
            name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$strip>;
        create_time: z.ZodNullable<z.ZodNumber>;
        update_time: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        content: z.ZodObject<{
            content_type: z.ZodDefault<z.ZodString>;
            parts: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>>;
        }, z.core.$strip>;
        status: z.ZodOptional<z.ZodString>;
        end_turn: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
        weight: z.ZodOptional<z.ZodNumber>;
        recipient: z.ZodOptional<z.ZodString>;
        metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const ConversationSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodNullable<z.ZodString>;
    create_time: z.ZodNumber;
    update_time: z.ZodNumber;
    current_node: z.ZodString;
    is_archived: z.ZodOptional<z.ZodBoolean>;
    moderation_results: z.ZodDefault<z.ZodArray<z.ZodUnknown>>;
    mapping: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        parent: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        children: z.ZodArray<z.ZodString>;
        message: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            author: z.ZodObject<{
                role: z.ZodEnum<{
                    user: "user";
                    assistant: "assistant";
                    system: "system";
                    tool: "tool";
                }>;
                name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, z.core.$strip>;
            create_time: z.ZodNullable<z.ZodNumber>;
            update_time: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            content: z.ZodObject<{
                content_type: z.ZodDefault<z.ZodString>;
                parts: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>>;
            }, z.core.$strip>;
            status: z.ZodOptional<z.ZodString>;
            end_turn: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
            weight: z.ZodOptional<z.ZodNumber>;
            recipient: z.ZodOptional<z.ZodString>;
            metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    plugin_ids: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    conversation_template_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    gizmo_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    safe_urls: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const ChatGPTExportSchema: z.ZodArray<z.ZodObject<{
    id: z.ZodString;
    title: z.ZodNullable<z.ZodString>;
    create_time: z.ZodNumber;
    update_time: z.ZodNumber;
    current_node: z.ZodString;
    is_archived: z.ZodOptional<z.ZodBoolean>;
    moderation_results: z.ZodDefault<z.ZodArray<z.ZodUnknown>>;
    mapping: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        parent: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        children: z.ZodArray<z.ZodString>;
        message: z.ZodOptional<z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            author: z.ZodObject<{
                role: z.ZodEnum<{
                    user: "user";
                    assistant: "assistant";
                    system: "system";
                    tool: "tool";
                }>;
                name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
            }, z.core.$strip>;
            create_time: z.ZodNullable<z.ZodNumber>;
            update_time: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            content: z.ZodObject<{
                content_type: z.ZodDefault<z.ZodString>;
                parts: z.ZodOptional<z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>]>>>;
            }, z.core.$strip>;
            status: z.ZodOptional<z.ZodString>;
            end_turn: z.ZodOptional<z.ZodNullable<z.ZodBoolean>>;
            weight: z.ZodOptional<z.ZodNumber>;
            recipient: z.ZodOptional<z.ZodString>;
            metadata: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>;
    plugin_ids: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodString>>>;
    conversation_template_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    gizmo_id: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    safe_urls: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>>;
export declare const UserSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export declare const MessageFeedbackSchema: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
export declare const ModelComparisonsSchema: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
export declare const SharedConversationsSchema: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
export type Author = z.infer<typeof AuthorSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type ChatGPTExport = z.infer<typeof ChatGPTExportSchema>;
export declare function validateConversations(data: unknown): Conversation[];
export declare function validateUser(data: unknown): Record<string, any>;
export declare function validateMessageFeedback(data: unknown): Record<string, any>[];
export declare function validateModelComparisons(data: unknown): Record<string, any>[];
export declare function validateSharedConversations(data: unknown): Record<string, any>[];
//# sourceMappingURL=schema.d.ts.map