import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';
import { 
  ConversationExport, 
  ParsedConversation, 
  ParsedMessage, 
  ExportData,
  MessageNode,
  ConversationBranch,
  MessageTree
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
  const messageTree = buildMessageTree(conversation);
  const branches = identifyBranches(messages, conversation.mapping);
  
  return {
    id: conversation.id,
    title: conversation.title,
    createTime: new Date(conversation.create_time * 1000),
    updateTime: new Date(conversation.update_time * 1000),
    messages,
    messageTree,
    branches,
    originalMapping: conversation.mapping,
    isArchived: conversation.is_archived ?? false,
    safeUrls: conversation.safe_urls
  };
}

export function buildMessageTree(conversation: ConversationExport): MessageTree | undefined {
  const messages = getConversationMessages(conversation);
  const treeMap = new Map<string, MessageTree>();
  
  // Build tree nodes for all messages
  messages.forEach(msg => {
    treeMap.set(msg.id, {
      id: msg.id,
      message: msg,
      parent: undefined,
      children: [],
      branchId: msg.branchId || 'main'
    });
  });
  
  // Connect parent-child relationships
  messages.forEach(msg => {
    const treeNode = treeMap.get(msg.id);
    if (!treeNode) return;
    
    // Set parent
    if (msg.parentId) {
      const parentNode = treeMap.get(msg.parentId);
      if (parentNode) {
        treeNode.parent = parentNode;
        parentNode.children.push(treeNode);
      }
    }
  });
  
  // Find root nodes (nodes with no parent)
  const rootNodes: MessageTree[] = [];
  for (const node of treeMap.values()) {
    if (!node.parent) {
      rootNodes.push(node);
    }
  }
  
  // If we have multiple root nodes, create a virtual root
  if (rootNodes.length > 1) {
    const virtualRoot: MessageTree = {
      id: 'virtual-root',
      message: messages[0], // Use first message as representative
      parent: undefined,
      children: rootNodes,
      branchId: 'virtual-root'
    };
    return virtualRoot;
  }
  
  // Return the first root node (or undefined if no messages)
  return rootNodes.length > 0 ? rootNodes[0] : undefined;
}

export function identifyBranches(messages: ParsedMessage[], mapping: Record<string, MessageNode>): ConversationBranch[] {
  const branches: ConversationBranch[] = [];
  const messageMap = new Map(messages.map(msg => [msg.id, msg]));
  
  // Find root messages (no parent or parent not in our message list)
  const rootMessages = messages.filter(msg => 
    !msg.parentId || !messageMap.has(msg.parentId)
  );
  
  // Group messages by their branch
  const branchGroups = new Map<string, ParsedMessage[]>();
  
  rootMessages.forEach((rootMsg, index) => {
    const branchId = `branch-${index}`;
    const branchMessages: ParsedMessage[] = [];
    
    // Traverse this branch
    const traverseBranch = (msg: ParsedMessage) => {
      branchMessages.push({ ...msg, branchId });
      
      // Add children to this branch
      msg.childrenIds?.forEach(childId => {
        const childMsg = messageMap.get(childId);
        if (childMsg) {
          traverseBranch(childMsg);
        }
      });
    };
    
    traverseBranch(rootMsg);
    branchGroups.set(branchId, branchMessages);
  });
  
  // Convert to ConversationBranch objects
  branchGroups.forEach((messages, branchId) => {
    if (messages.length > 0) {
      const sortedMessages = messages.sort((a, b) => 
        a.createTime.getTime() - b.createTime.getTime()
      );
      
      branches.push({
        id: branchId,
        messages: sortedMessages,
        startTime: sortedMessages[0].createTime,
        endTime: sortedMessages[sortedMessages.length - 1].createTime,
        childrenBranchIds: []
      });
    }
  });
  
  return branches;
}

export function getConversationMessages(conversation: ConversationExport): ParsedMessage[] {
  const messages: ParsedMessage[] = [];
  const visited = new Set<string>();
  
  // First, get all messages by traversing the full tree
  const allNodes = new Set<string>();
  
  // Start from current_node and traverse backward to find all nodes
  let nodeId: string | undefined = conversation.current_node;
  while (nodeId) {
    const node: MessageNode | undefined = conversation.mapping[nodeId];
    if (!node) break;
    
    allNodes.add(nodeId);
    nodeId = node.parent;
  }
  
  // Now traverse forward from all nodes to get the full conversation
  const traverseNode = (nodeId: string) => {
    const node = conversation.mapping[nodeId];
    if (!node || visited.has(nodeId)) return;
    
    visited.add(nodeId);
    
    if (node.message) {
      messages.push({
        id: node.message.id,
        role: node.message.author.role,
        content: node.message.content.parts?.join('') || '',
        createTime: new Date((node.message.create_time || 0) * 1000),
        metadata: node.message.metadata,
        parentId: node.parent || undefined,
        childrenIds: node.children || []
      });
    }
    
    // Traverse all children (branches)
    node.children.forEach(childId => {
      traverseNode(childId);
    });
  };
  
  // Traverse from all nodes we found
  allNodes.forEach(nodeId => {
    traverseNode(nodeId);
  });
  
  // Sort by creation time to maintain chronological order
  return messages.sort((a, b) => a.createTime.getTime() - b.createTime.getTime());
}

 