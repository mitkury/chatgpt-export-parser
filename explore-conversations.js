const { parseExport } = require('./dist/index.js');

async function exploreConversations() {
  console.log('Exploring ChatGPT conversations...\n');
  
  const data = await parseExport('./data/chatgpt-august-2-2025.zip');
  
  console.log(`Total conversations: ${data.conversations.length}`);
  
  // Sample different types of conversations
  const samples = data.conversations.slice(0, 10);
  
  samples.forEach((conv, index) => {
    console.log(`\n--- Conversation ${index + 1}: "${conv.title}" ---`);
    console.log(`ID: ${conv.id}`);
    console.log(`Created: ${conv.createTime.toISOString()}`);
    console.log(`Updated: ${conv.updateTime.toISOString()}`);
    console.log(`Archived: ${conv.isArchived}`);
    console.log(`Messages: ${conv.messages.length}`);
    console.log(`Safe URLs: ${conv.safeUrls.length}`);
    
    // Show message breakdown
    const roleCounts = conv.messages.reduce((acc, msg) => {
      acc[msg.role] = (acc[msg.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Message breakdown:', roleCounts);
    
    // Show first few messages with more detail
    console.log('\nFirst 3 messages:');
    conv.messages.slice(0, 3).forEach((msg, i) => {
      console.log(`  ${i + 1}. [${msg.role.toUpperCase()}] ${msg.content.substring(0, 100)}...`);
      console.log(`     ID: ${msg.id}, Time: ${msg.createTime.toISOString()}`);
      if (Object.keys(msg.metadata).length > 0) {
        console.log(`     Metadata keys: ${Object.keys(msg.metadata).join(', ')}`);
      }
    });
    
    // Check for special properties
    const hasSystemMessages = conv.messages.some(msg => msg.role === 'system');
    const hasLongMessages = conv.messages.some(msg => msg.content.length > 1000);
    const hasMetadata = conv.messages.some(msg => Object.keys(msg.metadata).length > 0);
    
    console.log(`\nSpecial properties:`);
    console.log(`  - Has system messages: ${hasSystemMessages}`);
    console.log(`  - Has long messages (>1000 chars): ${hasLongMessages}`);
    console.log(`  - Has metadata: ${hasMetadata}`);
  });
  
  // Find conversations with interesting properties
  console.log('\n\n=== SPECIAL CONVERSATIONS ===');
  
  const withSystemMessages = data.conversations.filter(conv => 
    conv.messages.some(msg => msg.role === 'system')
  );
  console.log(`Conversations with system messages: ${withSystemMessages.length}`);
  
  const withSafeUrls = data.conversations.filter(conv => conv.safeUrls.length > 0);
  console.log(`Conversations with safe URLs: ${withSafeUrls.length}`);
  
  const archived = data.conversations.filter(conv => conv.isArchived);
  console.log(`Archived conversations: ${archived.length}`);
  
  const longConversations = data.conversations.filter(conv => conv.messages.length > 100);
  console.log(`Long conversations (>100 messages): ${longConversations.length}`);
  
  // Show example of conversation with safe URLs
  if (withSafeUrls.length > 0) {
    const example = withSafeUrls[0];
    console.log(`\nExample conversation with safe URLs: "${example.title}"`);
    console.log(`Safe URLs: ${example.safeUrls.join(', ')}`);
  }
  
  // Show example of conversation with system messages
  if (withSystemMessages.length > 0) {
    const example = withSystemMessages[0];
    const systemMessages = example.messages.filter(msg => msg.role === 'system');
    console.log(`\nExample conversation with system messages: "${example.title}"`);
    console.log(`System messages: ${systemMessages.length}`);
    systemMessages.forEach((msg, i) => {
      console.log(`  System ${i + 1}: ${msg.content.substring(0, 200)}...`);
    });
  }
}

exploreConversations().catch(console.error); 