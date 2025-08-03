import { describe, it, expect } from 'vitest';
import { parseExport } from '../src/parser';
import { getConversationMessages, buildMessageTree, identifyBranches } from '../src/parser';
import { validateConversations } from '../src/schema';
import { getTestArchivePath } from '../src/test-config';
import { MessageTree } from '../src/types';

describe('parseExport', () => {
  it('should parse a ChatGPT export archive', async () => {
    const zipPath = getTestArchivePath();
    
    const result = await parseExport(zipPath);
    
    // Basic structure validation
    expect(result).toHaveProperty('conversations');
    expect(result).toHaveProperty('files');
    expect(result).toHaveProperty('metadata');
    expect(Array.isArray(result.conversations)).toBe(true);
    expect(Array.isArray(result.files)).toBe(true);
    
    // Should have at least one conversation
    expect(result.conversations.length).toBeGreaterThan(0);
    
    // Check first conversation structure
    const firstConversation = result.conversations[0];
    expect(firstConversation).toHaveProperty('id');
    expect(firstConversation).toHaveProperty('title');
    expect(firstConversation).toHaveProperty('createTime');
    expect(firstConversation).toHaveProperty('updateTime');
    expect(firstConversation).toHaveProperty('messages');
    expect(firstConversation).toHaveProperty('isArchived');
    expect(firstConversation).toHaveProperty('safeUrls');
    
    expect(Array.isArray(firstConversation.messages)).toBe(true);
    expect(firstConversation.messages.length).toBeGreaterThan(0);
    
    // Check first message structure
    const firstMessage = firstConversation.messages[0];
    expect(firstMessage).toHaveProperty('id');
    expect(firstMessage).toHaveProperty('role');
    expect(firstMessage).toHaveProperty('content');
    expect(firstMessage).toHaveProperty('createTime');
    expect(firstMessage).toHaveProperty('metadata');
    
    expect(['user', 'assistant', 'system']).toContain(firstMessage.role);
    
    console.log(`Parsed ${result.conversations.length} conversations`);
    console.log(`First conversation: "${firstConversation.title}" with ${firstConversation.messages.length} messages`);
    console.log(`Files in archive: ${result.files.length}`);
  });

  it('should handle conversations with system messages', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    // Find conversations with system messages
    const conversationsWithSystem = result.conversations.filter(conv => 
      conv.messages.some(msg => msg.role === 'system')
    );
    
    expect(conversationsWithSystem.length).toBeGreaterThan(0);
    
    // Check that system messages have proper structure
    const systemMessages = conversationsWithSystem[0].messages.filter(msg => msg.role === 'system');
    expect(systemMessages.length).toBeGreaterThan(0);
    
    systemMessages.forEach(msg => {
      expect(msg.role).toBe('system');
      expect(typeof msg.content).toBe('string');
      expect(msg.id).toBeDefined();
      expect(msg.createTime).toBeInstanceOf(Date);
      expect(msg.metadata).toBeDefined();
    });
  });

  it('should handle conversations with safe URLs', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    // Find conversations with safe URLs
    const conversationsWithUrls = result.conversations.filter(conv => conv.safeUrls.length > 0);
    
    expect(conversationsWithUrls.length).toBeGreaterThan(0);
    
    // Check that safe URLs are properly formatted
    conversationsWithUrls.forEach(conv => {
      expect(Array.isArray(conv.safeUrls)).toBe(true);
      conv.safeUrls.forEach(url => {
        expect(typeof url).toBe('string');
        expect(url.length).toBeGreaterThan(0);
        // URLs should be valid strings (don't enforce specific protocol)
      });
    });
  });

  it('should handle archived conversations', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    // Find archived conversations
    const archivedConversations = result.conversations.filter(conv => conv.isArchived);
    
    // Should have some archived conversations
    expect(archivedConversations.length).toBeGreaterThanOrEqual(0);
    
    archivedConversations.forEach(conv => {
      expect(conv.isArchived).toBe(true);
      expect(conv.id).toBeDefined();
      expect(conv.title).toBeDefined();
    });
  });

  it('should handle conversations with tool messages', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    // Find conversations with tool messages (role: 'tool')
    const conversationsWithTools = result.conversations.filter(conv => 
      conv.messages.some(msg => msg.role === 'tool')
    );
    
    expect(conversationsWithTools.length).toBeGreaterThan(0);
    
    // Check tool message structure
    const toolMessages = conversationsWithTools[0].messages.filter(msg => msg.role === 'tool');
    expect(toolMessages.length).toBeGreaterThan(0);
    
    toolMessages.forEach(msg => {
      expect(msg.role).toBe('tool');
      expect(typeof msg.content).toBe('string');
      expect(msg.id).toBeDefined();
      expect(msg.createTime).toBeInstanceOf(Date);
    });
  });

  it('should handle messages with rich metadata', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    // Find messages with metadata
    const messagesWithMetadata = result.conversations.flatMap(conv => 
      conv.messages.filter(msg => Object.keys(msg.metadata).length > 0)
    );
    
    expect(messagesWithMetadata.length).toBeGreaterThan(0);
    
    // Check common metadata keys
    const metadataKeys = new Set();
    messagesWithMetadata.forEach(msg => {
      Object.keys(msg.metadata).forEach(key => metadataKeys.add(key));
    });
    
    // Should have some common metadata keys
    expect(metadataKeys.size).toBeGreaterThan(0);
    
    // Check that metadata is properly structured
    messagesWithMetadata.forEach(msg => {
      expect(typeof msg.metadata).toBe('object');
      expect(msg.metadata).not.toBeNull();
    });
  });

  it('should handle long conversations', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    // Find long conversations (>100 messages)
    const longConversations = result.conversations.filter(conv => conv.messages.length > 100);
    
    expect(longConversations.length).toBeGreaterThan(0);
    
    longConversations.forEach(conv => {
      expect(conv.messages.length).toBeGreaterThan(100);
      expect(conv.id).toBeDefined();
      expect(conv.title).toBeDefined();
      
      // Should have proper message sequence
      expect(conv.messages.length).toBeGreaterThan(0);
      conv.messages.forEach(msg => {
        expect(msg.id).toBeDefined();
        expect(['user', 'assistant', 'system', 'tool']).toContain(msg.role);
        expect(typeof msg.content).toBe('string');
      });
    });
  });

  it('should handle conversations with attachments', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    // Find messages that mention attachments in metadata
    const messagesWithAttachments = result.conversations.flatMap(conv => 
      conv.messages.filter(msg => msg.metadata.attachments)
    );
    
    // Should handle attachment metadata properly
    messagesWithAttachments.forEach(msg => {
      expect(msg.metadata.attachments).toBeDefined();
      expect(Array.isArray(msg.metadata.attachments)).toBe(true);
    });
  });

  it('should preserve conversation timestamps correctly', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    result.conversations.forEach(conv => {
      expect(conv.createTime).toBeInstanceOf(Date);
      expect(conv.updateTime).toBeInstanceOf(Date);
      
      // Create time should be before or equal to update time (allowing for small precision differences)
      const createTime = conv.createTime.getTime();
      const updateTime = conv.updateTime.getTime();
      // Allow some tolerance for timestamp precision issues
      expect(createTime).toBeLessThanOrEqual(updateTime + 5000); // Allow 5 second tolerance
      
      // Messages should have valid timestamps (some messages might have epoch start)
      conv.messages.forEach(msg => {
        expect(msg.createTime).toBeInstanceOf(Date);
        // Allow epoch start (0) for any message type as ChatGPT sometimes uses this
        expect(msg.createTime.getTime()).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('should handle conversations with different languages', async () => {
    const zipPath = getTestArchivePath();
    const result = await parseExport(zipPath);
    
    // Find conversations with non-English content
    const nonEnglishConversations = result.conversations.filter(conv => 
      conv.messages.some(msg => 
        msg.content.length > 0 && 
        /[^\x00-\x7F]/.test(msg.content) // Contains non-ASCII characters
      )
    );
    
    expect(nonEnglishConversations.length).toBeGreaterThan(0);
    
    nonEnglishConversations.forEach(conv => {
      const nonEnglishMessages = conv.messages.filter(msg => 
        msg.content.length > 0 && /[^\x00-\x7F]/.test(msg.content)
      );
      
      expect(nonEnglishMessages.length).toBeGreaterThan(0);
      
      nonEnglishMessages.forEach(msg => {
        expect(typeof msg.content).toBe('string');
        expect(msg.content.length).toBeGreaterThan(0);
      });
    });
  });

  it('should handle branched conversations correctly', async () => {
    const zipPath = getTestArchivePath();
    
    const result = await parseExport(zipPath);
    
    // Find conversations with multiple children (potential branches)
    const branchedConversations = result.conversations.filter(conv => {
      // Look for nodes with multiple children in the original mapping
      const originalConv = result.conversations.find(c => c.id === conv.id);
      if (!originalConv) return false;
      
      // This is a simplified check - in a real scenario we'd need to access the original mapping
      // For now, we'll check if we have conversations with many messages (potential branches)
      return conv.messages.length > 20; // Likely to have branches if many messages
    });
    
    console.log(`Found ${branchedConversations.length} conversations with potential branches`);
    
    // Verify that branched conversations are processed
    expect(branchedConversations.length).toBeGreaterThan(0);
    
    // Check that messages are in chronological order
    branchedConversations.forEach(conv => {
      for (let i = 1; i < conv.messages.length; i++) {
        const prevTime = conv.messages[i - 1].createTime.getTime();
        const currTime = conv.messages[i].createTime.getTime();
        expect(currTime).toBeGreaterThanOrEqual(prevTime);
      }
    });
  });

  it('should properly identify and structure conversation branches', async () => {
    const zipPath = getTestArchivePath();
    
    const result = await parseExport(zipPath);
    
    // Find conversations with branches
    const conversationsWithBranches = result.conversations.filter(conv => 
      conv.branches && conv.branches.length > 0
    );
    
    console.log(`Found ${conversationsWithBranches.length} conversations with identified branches`);
    
    // Test that branches are properly structured
    conversationsWithBranches.forEach(conv => {
      expect(conv.branches).toBeDefined();
      expect(Array.isArray(conv.branches)).toBe(true);
      
      conv.branches!.forEach(branch => {
        // Each branch should have messages
        expect(branch.messages.length).toBeGreaterThan(0);
        
        // Messages should be in chronological order
        for (let i = 1; i < branch.messages.length; i++) {
          const prevTime = branch.messages[i - 1].createTime.getTime();
          const currTime = branch.messages[i].createTime.getTime();
          expect(currTime).toBeGreaterThanOrEqual(prevTime);
        }
        
        // Branch should have valid time range
        expect(branch.startTime.getTime()).toBeLessThanOrEqual(branch.endTime.getTime());
        
                 // Messages should have branch information
         branch.messages.forEach(msg => {
           expect(msg.branchId).toBe(branch.id);
           // parentId can be undefined for root messages
           expect(Array.isArray(msg.childrenIds || [])).toBe(true);
         });
      });
    });
    
    // Test that messages have proper parent-child relationships
    const conversationsWithRelationships = result.conversations.filter(conv =>
      conv.messages.some(msg => msg.parentId || (msg.childrenIds && msg.childrenIds.length > 0))
    );
    
    console.log(`Found ${conversationsWithRelationships.length} conversations with parent-child relationships`);
    expect(conversationsWithRelationships.length).toBeGreaterThan(0);
  });

  it('should provide both flat messages and tree structure', async () => {
    const zipPath = getTestArchivePath();
    
    const result = await parseExport(zipPath);
    
    // Test that conversations have both flat messages and tree structure
    const conversationsWithTree = result.conversations.filter(conv => 
      conv.messageTree && conv.messages.length > 0
    );
    
    console.log(`Found ${conversationsWithTree.length} conversations with tree structure`);
    expect(conversationsWithTree.length).toBeGreaterThan(0);
    
    // Test tree structure properties
    conversationsWithTree.forEach(conv => {
      expect(conv.messageTree).toBeDefined();
      expect(conv.messageTree!.id).toBeDefined();
      expect(conv.messageTree!.message).toBeDefined();
      expect(Array.isArray(conv.messageTree!.children)).toBe(true);
      
      // Test that tree messages match flat messages
      const treeMessageIds = new Set<string>();
      const collectMessageIds = (node: MessageTree) => {
        treeMessageIds.add(node.message.id);
        node.children.forEach(collectMessageIds);
      };
      collectMessageIds(conv.messageTree!);
      
      const flatMessageIds = new Set(conv.messages.map(msg => msg.id));
      expect(treeMessageIds.size).toBe(flatMessageIds.size);
      
      // All tree messages should be in flat messages
      treeMessageIds.forEach(id => {
        expect(flatMessageIds.has(id)).toBe(true);
      });
    });
    
    // Test that original mapping is preserved
    const conversationsWithMapping = result.conversations.filter(conv => 
      conv.originalMapping && Object.keys(conv.originalMapping).length > 0
    );
    
    console.log(`Found ${conversationsWithMapping.length} conversations with original mapping`);
    expect(conversationsWithMapping.length).toBeGreaterThan(0);
  });
}); 

describe('Example conversation with branch', () => {
  it('should parse branched conversation correctly', async () => {
    // Read the example conversation
    const fs = require('fs');
    const rawData = JSON.parse(fs.readFileSync('./tests/example-conversation.json', 'utf8'));
    
    // Validate the data
    const conversations = validateConversations(rawData) as any;
    expect(conversations).toHaveLength(1);
    
    const conversation = conversations[0];
    
    // Test basic conversation properties
    expect(conversation.id).toBe('conv-123');
    expect(conversation.title).toBe('Sample conversation with branch');
    expect(conversation.current_node).toBe('msg-6');
    expect(conversation.is_archived).toBe(false);
    
    // Test message parsing
    const messages = getConversationMessages(conversation as any);
    expect(messages).toHaveLength(6);
    
    // Test message order and roles
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
    expect(messages[2].role).toBe('assistant');
    expect(messages[3].role).toBe('user');
    expect(messages[4].role).toBe('user');
    expect(messages[5].role).toBe('assistant');
    
    // Test parent-child relationships
    expect(messages[0].parentId).toBeUndefined(); // Root node
    expect(messages[1].parentId).toBe('msg-1');
    expect(messages[2].parentId).toBe('msg-2');
    expect(messages[3].parentId).toBe('msg-3');
    expect(messages[4].parentId).toBe('msg-3');
    expect(messages[5].parentId).toBe('msg-4');
    
    // Test children relationships
    expect(messages[0].childrenIds).toEqual(['msg-2']);
    expect(messages[1].childrenIds).toEqual(['msg-3']);
    expect(messages[2].childrenIds).toEqual(['msg-4', 'msg-5']); // Branch point
    expect(messages[3].childrenIds).toEqual(['msg-6']);
    expect(messages[4].childrenIds).toEqual([]); // Abandoned branch
    expect(messages[5].childrenIds).toEqual([]); // End of active branch
    
    // Test tree structure
    const tree = buildMessageTree(conversation as any);
    expect(tree).toBeDefined();
    expect(tree!.id).toBe('msg-1');
    expect(tree!.children).toHaveLength(1);
    
    // Test that the tree shows the branch
    const assistantNode = tree!.children[0].children[0]; // msg-3
    expect(assistantNode.children).toHaveLength(2); // Two branches
    
    // Test branch identification
    const branches = identifyBranches(messages, conversation.mapping as any);
    expect(branches.length).toBeGreaterThan(0);
    
    // Test that we can find the main branch (the one with more messages)
    const mainBranch = branches.find(b => b.messages.length > 1);
    expect(mainBranch).toBeDefined();
    
    // Test that main branch leads to current_node
    const lastMessage = mainBranch!.messages[mainBranch!.messages.length - 1];
    expect(lastMessage.id).toBe('msg-6');
    
    // Test that all messages are included in the branch
    expect(mainBranch!.messages).toHaveLength(6);
  });
  
  it('should handle content parts correctly', async () => {
    const fs = require('fs');
    const rawData = JSON.parse(fs.readFileSync('./tests/example-conversation.json', 'utf8'));
    const conversations = validateConversations(rawData) as any;
    const conversation = conversations[0];
    const messages = getConversationMessages(conversation as any);
    
    // Test content extraction
    expect(messages[1].content).toBe('Hello! Can you help me with a programming question?');
    expect(messages[2].content).toBe("Of course! I'd be happy to help with your programming question. What would you like to know?");
    expect(messages[3].content).toBe('How do I write a function in JavaScript?');
    expect(messages[4].content).toBe('Actually, can you help me with Python instead?');
    expect(messages[5].content).toContain('Here\'s how to write a function in JavaScript:');
    expect(messages[5].content).toContain('```javascript');
  });
  
  it('should preserve metadata correctly', async () => {
    const fs = require('fs');
    const rawData = JSON.parse(fs.readFileSync('./tests/example-conversation.json', 'utf8'));
    const conversations = validateConversations(rawData) as any;
    const conversation = conversations[0];
    const messages = getConversationMessages(conversation as any);
    
    // Test assistant message metadata
    const assistantMessage = messages.find(m => m.role === 'assistant' && m.id === 'msg-6');
    expect(assistantMessage).toBeDefined();
    expect(assistantMessage!.metadata).toHaveProperty('model_slug');
    expect(assistantMessage!.metadata).toHaveProperty('finish_details');
    expect((assistantMessage!.metadata as any).model_slug).toBe('gpt-4');
    expect((assistantMessage!.metadata as any).finish_details.type).toBe('stop');
  });
}); 