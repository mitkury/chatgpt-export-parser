const fs = require('fs');

// Read the example conversation
const rawData = JSON.parse(fs.readFileSync('./example-conversation.json', 'utf8'));

console.log('=== Simple Example Conversation Test ===\n');

// Show the conversation structure
const conversation = rawData[0];
console.log('Conversation:', conversation.title);
console.log('Current node:', conversation.current_node);
console.log('Total nodes in mapping:', Object.keys(conversation.mapping).length);
console.log('');

// Show the mapping structure
console.log('Message mapping:');
Object.entries(conversation.mapping).forEach(([id, node]) => {
  console.log(`\nNode ${id}:`);
  console.log(`  Parent: ${node.parent || 'none'}`);
  console.log(`  Children: ${node.children.join(', ') || 'none'}`);
  
  if (node.message) {
    console.log(`  Role: ${node.message.author.role}`);
    console.log(`  Content: ${node.message.content.parts.join('').substring(0, 60)}...`);
    console.log(`  Time: ${new Date(node.message.create_time * 1000).toISOString()}`);
  } else {
    console.log(`  No message content`);
  }
});

console.log('\n=== Branch Analysis ===');
console.log('This conversation has a branch at msg-3:');
console.log('- msg-3 (assistant) has two children: msg-4 and msg-5');
console.log('- msg-4 (user) continues to msg-6 (assistant) - this is the "active" branch');
console.log('- msg-5 (user) has no children - this is an "abandoned" branch');
console.log('- The current_node is msg-6, so msg-4->msg-6 is the active path');

console.log('\n=== Expected Parser Output ===');
console.log('Our parser should:');
console.log('1. Find all 6 messages (including the abandoned branch)');
console.log('2. Identify parent-child relationships');
console.log('3. Build a tree structure showing the branch');
console.log('4. Identify that msg-5 is an abandoned branch');
console.log('5. Show that the active path is msg-1 -> msg-2 -> msg-3 -> msg-4 -> msg-6'); 