const { parseExport } = require('./dist/index.js');
const { getTestArchivePath } = require('./dist/test-config.js');

async function debugBranches() {
  console.log('Debugging branch structure...\n');
  
  const data = await parseExport(getTestArchivePath());
  
  // Look at the first conversation
  const firstConv = data.conversations[0];
  console.log(`First conversation: "${firstConv.title}"`);
  console.log(`Messages: ${firstConv.messages.length}`);
  console.log(`Branches: ${firstConv.branches?.length || 0}`);
  
  // Check first few messages for parent-child relationships
  console.log('\nFirst 5 messages:');
  firstConv.messages.slice(0, 5).forEach((msg, i) => {
    console.log(`${i + 1}. [${msg.role}] ${msg.id}`);
    console.log(`   Parent: ${msg.parentId || 'none'}`);
    console.log(`   Children: ${msg.childrenIds?.length || 0}`);
    console.log(`   Branch: ${msg.branchId || 'none'}`);
  });
  
  // Check if any messages have parent-child relationships
  const messagesWithRelationships = firstConv.messages.filter(msg => 
    msg.parentId || (msg.childrenIds && msg.childrenIds.length > 0)
  );
  
  console.log(`\nMessages with relationships: ${messagesWithRelationships.length}`);
  
  if (messagesWithRelationships.length > 0) {
    messagesWithRelationships.slice(0, 3).forEach((msg, i) => {
      console.log(`${i + 1}. [${msg.role}] ${msg.id}`);
      console.log(`   Parent: ${msg.parentId || 'none'}`);
      console.log(`   Children: ${msg.childrenIds?.join(', ') || 'none'}`);
    });
  }
}

debugBranches().catch(console.error); 