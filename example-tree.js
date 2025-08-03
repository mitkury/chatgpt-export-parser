const { parseExport } = require('./dist/index.js');
const { getTestArchivePath } = require('./dist/test-config.js');

async function demonstrateTreeStructure() {
  console.log('Demonstrating tree structure for branched conversations...\n');
  
  const data = await parseExport(getTestArchivePath());
  
  // Find a conversation with branches
  const conversationWithBranches = data.conversations.find(conv => 
    conv.messageTree && conv.messages.length > 10
  );
  
  if (!conversationWithBranches) {
    console.log('No conversation with branches found');
    return;
  }
  
  console.log(`Conversation: "${conversationWithBranches.title}"`);
  console.log(`Total messages: ${conversationWithBranches.messages.length}`);
  console.log(`Has tree structure: ${!!conversationWithBranches.messageTree}`);
  
  // Show flat message array (simple approach)
  console.log('\n=== Flat Message Array ===');
  console.log('First 5 messages:');
  conversationWithBranches.messages.slice(0, 5).forEach((msg, i) => {
    console.log(`${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
  });
  
  // Show tree structure (advanced approach)
  console.log('\n=== Tree Structure ===');
  const printTree = (node, depth = 0) => {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${node.message.role}: ${node.message.content.substring(0, 30)}...`);
    node.children.forEach(child => printTree(child, depth + 1));
  };
  
  if (conversationWithBranches.messageTree) {
    console.log('Tree structure:');
    printTree(conversationWithBranches.messageTree);
  }
  
  // Show branch information
  console.log('\n=== Branch Information ===');
  if (conversationWithBranches.branches) {
    console.log(`Found ${conversationWithBranches.branches.length} branches`);
    conversationWithBranches.branches.slice(0, 3).forEach((branch, i) => {
      console.log(`Branch ${i + 1}: ${branch.messages.length} messages`);
      console.log(`  Time range: ${branch.startTime.toISOString()} to ${branch.endTime.toISOString()}`);
    });
  }
  
  // Show how to access original mapping
  console.log('\n=== Original Mapping ===');
  if (conversationWithBranches.originalMapping) {
    const mappingKeys = Object.keys(conversationWithBranches.originalMapping);
    console.log(`Original mapping has ${mappingKeys.length} nodes`);
    console.log(`Sample node: ${mappingKeys[0]}`);
  }
}

demonstrateTreeStructure().catch(console.error); 