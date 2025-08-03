const { parseExport } = require('./dist/index.js');

async function main() {
  try {
    console.log('Parsing ChatGPT export...');
    const data = await parseExport('./data/chatgpt-august-2-2025.zip');
    
    console.log(`\nFound ${data.conversations.length} conversations`);
    console.log(`Archive contains ${data.files.length} files`);
    
    if (data.conversations.length > 0) {
      const firstConversation = data.conversations[0];
      console.log(`\nFirst conversation: "${firstConversation.title}"`);
      console.log(`Created: ${firstConversation.createTime.toISOString()}`);
      console.log(`Messages: ${firstConversation.messages.length}`);
      
      // Show first few messages
      console.log('\nFirst few messages:');
      firstConversation.messages.slice(0, 3).forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.role.toUpperCase()}] ${msg.content.substring(0, 100)}...`);
      });
    }
    
    if (data.metadata.user) {
      console.log('\nUser info found in metadata');
    }
    
  } catch (error) {
    console.error('Error parsing export:', error.message);
  }
}

main(); 