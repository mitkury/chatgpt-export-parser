import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { 
  ConversationExport, 
  ParsedConversation, 
  ParsedMessage, 
  ExportData,
  MessageNode
} from './types';
import { 
  validateConversations, 
  validateUser, 
  validateMessageFeedback, 
  validateModelComparisons, 
  validateSharedConversations 
} from './schema';

export async function parseExport(zipPath: string): Promise<ExportData> {
  const zip = new AdmZip(zipPath);
  const zipEntries = zip.getEntries();
  
  const files: string[] = [];
  const metadata: ExportData['metadata'] = {};
  
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
  const rawConversations = JSON.parse(conversationsData);
  const conversations = validateConversations(rawConversations) as ConversationExport[];
  
  // Parse other metadata files if they exist
  const userEntry = zip.getEntry('user.json');
  if (userEntry) {
    const rawUser = JSON.parse(userEntry.getData().toString('utf-8'));
    metadata.user = validateUser(rawUser);
  }
  
  const messageFeedbackEntry = zip.getEntry('message_feedback.json');
  if (messageFeedbackEntry) {
    const rawFeedback = JSON.parse(messageFeedbackEntry.getData().toString('utf-8'));
    metadata.messageFeedback = validateMessageFeedback(rawFeedback);
  }
  
  const modelComparisonsEntry = zip.getEntry('model_comparisons.json');
  if (modelComparisonsEntry) {
    const rawComparisons = JSON.parse(modelComparisonsEntry.getData().toString('utf-8'));
    metadata.modelComparisons = validateModelComparisons(rawComparisons);
  }
  
  const sharedConversationsEntry = zip.getEntry('shared_conversations.json');
  if (sharedConversationsEntry) {
    const rawShared = JSON.parse(sharedConversationsEntry.getData().toString('utf-8'));
    metadata.sharedConversations = validateSharedConversations(rawShared);
  }
  
  // Parse each conversation
  const parsedConversations = conversations.map(parseConversation);
  
  return {
    conversations: parsedConversations,
    files,
    metadata
  };
}

function parseConversation(conversation: ConversationExport): ParsedConversation {
  const messages = getConversationMessages(conversation);
  
  return {
    id: conversation.id,
    title: conversation.title,
    createTime: new Date(conversation.create_time * 1000),
    updateTime: new Date(conversation.update_time * 1000),
    messages,
    isArchived: conversation.is_archived ?? false,
    safeUrls: conversation.safe_urls
  };
}

function getConversationMessages(conversation: ConversationExport): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  let nodeId: string | undefined = conversation.current_node;
  
  // Walk backwards from current_node to root
  while (nodeId) {
    const node: MessageNode | undefined = conversation.mapping[nodeId];
    if (!node) break;
    
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