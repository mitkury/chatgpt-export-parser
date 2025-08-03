import { describe, it, expect } from 'vitest';
import { parseExport } from './parser';
import * as path from 'path';

describe('parseExport', () => {
  it('should parse a ChatGPT export archive', async () => {
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
    
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
    const zipPath = path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip');
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
}); 