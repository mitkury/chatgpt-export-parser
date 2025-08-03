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
}); 