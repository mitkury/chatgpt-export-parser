"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExport = parseExport;
const adm_zip_1 = __importDefault(require("adm-zip"));
async function parseExport(zipPath) {
    const zip = new adm_zip_1.default(zipPath);
    const zipEntries = zip.getEntries();
    const files = [];
    const metadata = {};
    // Extract all files from zip
    for (const entry of zipEntries) {
        if (!entry.isDirectory) {
            files.push(entry.entryName);
        }
    }
    // Parse conversations.json
    const conversationsEntry = zip.getEntry('conversations.json');
    if (!conversationsEntry) {
        throw new Error('conversations.json not found in export archive');
    }
    const conversationsData = conversationsEntry.getData().toString('utf-8');
    const conversations = JSON.parse(conversationsData);
    // Parse other metadata files if they exist
    const userEntry = zip.getEntry('user.json');
    if (userEntry) {
        metadata.user = JSON.parse(userEntry.getData().toString('utf-8'));
    }
    const messageFeedbackEntry = zip.getEntry('message_feedback.json');
    if (messageFeedbackEntry) {
        metadata.messageFeedback = JSON.parse(messageFeedbackEntry.getData().toString('utf-8'));
    }
    const modelComparisonsEntry = zip.getEntry('model_comparisons.json');
    if (modelComparisonsEntry) {
        metadata.modelComparisons = JSON.parse(modelComparisonsEntry.getData().toString('utf-8'));
    }
    const sharedConversationsEntry = zip.getEntry('shared_conversations.json');
    if (sharedConversationsEntry) {
        metadata.sharedConversations = JSON.parse(sharedConversationsEntry.getData().toString('utf-8'));
    }
    // Parse each conversation
    const parsedConversations = conversations.map(parseConversation);
    return {
        conversations: parsedConversations,
        files,
        metadata
    };
}
function parseConversation(conversation) {
    const messages = getConversationMessages(conversation);
    return {
        id: conversation.id,
        title: conversation.title,
        createTime: new Date(conversation.create_time * 1000),
        updateTime: new Date(conversation.update_time * 1000),
        messages,
        isArchived: conversation.is_archived,
        safeUrls: conversation.safe_urls
    };
}
function getConversationMessages(conversation) {
    const messages = [];
    let nodeId = conversation.current_node;
    // Walk backwards from current_node to root
    while (nodeId) {
        const node = conversation.mapping[nodeId];
        if (!node)
            break;
        if (node.message) {
            messages.push({
                id: node.message.id,
                role: node.message.author.role,
                content: node.message.content.parts?.join('') || '',
                createTime: new Date(node.message.create_time * 1000),
                metadata: node.message.metadata
            });
        }
        nodeId = node.parent;
    }
    // Reverse to get chronological order
    return messages.reverse();
}
//# sourceMappingURL=parser.js.map