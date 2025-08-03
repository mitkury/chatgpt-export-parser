import { validateConversations } from './src/schema.js';
import { getConversationMessages, buildMessageTree, identifyBranches } from './src/parser.js';

// Read the example conversation
const fs = require('fs');
const rawData = JSON.parse(fs.readFileSync('./example-conversation.json', 'utf8'));

console.log('=== Testing Example Conversation ===\n');

// 1. Validate the data
console.log('1. Validating data...');
try {
  const conversations = validateConversations(rawData);
  console.log('✅ Validation passed!');
  console.log(`Found ${conversations.length} conversation(s)\n`);
} catch (error) {
  console.error('❌ Validation failed:', error.errors);
  process.exit(1);
}

// 2. Parse the conversation
console.log('2. Parsing conversation...');
const conversation = rawData[0];
const messages = getConversationMessages(conversation);
console.log(`✅ Parsed ${messages.length} messages\n`);

// 3. Show all messages
console.log('3. All messages (flat array):');
messages.forEach((msg, index) => {
  console.log(`${index + 1}. [${msg.role.toUpperCase()}] ${msg.content.substring(0, 50)}...`);
  if (msg.parentId) {
    console.log(`   Parent: ${msg.parentId}`);
  }
  if (msg.childrenIds && msg.childrenIds.length > 0) {
    console.log(`   Children: ${msg.childrenIds.join(', ')}`);
  }
  console.log('');
});

// 4. Build tree structure
console.log('4. Tree structure:');
const tree = buildMessageTree(conversation);
if (tree) {
  const traverseTree = (node, depth = 0) => {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${node.message.role.toUpperCase()}: ${node.message.content.substring(0, 40)}...`);
    node.children.forEach(child => traverseTree(child, depth + 1));
  };
  traverseTree(tree);
  console.log('');
}

// 5. Identify branches
console.log('5. Branch analysis:');
const branches = identifyBranches(conversation);
console.log(`Found ${branches.length} branch(es):`);
branches.forEach((branch, index) => {
  console.log(`  Branch ${index + 1}:`);
  console.log(`    Messages: ${branch.messages.length}`);
  console.log(`    Time: ${branch.startTime.toISOString()} to ${branch.endTime.toISOString()}`);
  console.log(`    Parent branch: ${branch.parentBranchId || 'none'}`);
  console.log(`    Children branches: ${branch.childrenBranchIds.length}`);
  console.log('');
});

console.log('=== Test Complete ==='); 