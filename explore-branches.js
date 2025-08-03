const { parseExport } = require('./dist/index.js');

async function exploreBranches() {
  console.log('Exploring branched conversations...\n');
  
  const data = await parseExport('./data/chatgpt-august-2-2025.zip');
  
  // Sample a few conversations to examine their structure
  const samples = data.conversations.slice(0, 5);
  
  samples.forEach((conv, index) => {
    console.log(`\n--- Conversation ${index + 1}: "${conv.title}" ---`);
    console.log(`ID: ${conv.id}`);
    console.log(`Messages: ${conv.messages.length}`);
    
    // Show message flow
    console.log('\nMessage flow:');
    conv.messages.forEach((msg, i) => {
      const time = msg.createTime.toISOString().split('T')[1].split('.')[0];
      console.log(`${i + 1}. [${msg.role}] ${time} - ${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}`);
    });
    
    // Check for potential branches (messages with same timestamp)
    const timeGroups = {};
    conv.messages.forEach(msg => {
      const time = msg.createTime.getTime();
      if (!timeGroups[time]) timeGroups[time] = [];
      timeGroups[time].push(msg);
    });
    
    const branches = Object.values(timeGroups).filter(group => group.length > 1);
    if (branches.length > 0) {
      console.log(`\nPotential branches found: ${branches.length}`);
      branches.forEach((branch, i) => {
        console.log(`Branch ${i + 1} at ${new Date(branch[0].createTime).toISOString()}:`);
        branch.forEach(msg => {
          console.log(`  - [${msg.role}] ${msg.content.substring(0, 30)}...`);
        });
      });
    }
  });
}

exploreBranches().catch(console.error); 