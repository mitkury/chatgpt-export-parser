import * as path from 'path';

// Test data configuration
export const TEST_CONFIG = {
  // Default test archive path
  defaultArchive: path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip'),
  
  // Alternative test archives (for future use)
  archives: {
    default: path.join(process.cwd(), 'data', 'chatgpt-august-2-2025.zip'),
    // Add more archives here as needed:
    // large: path.join(process.cwd(), 'data', 'large-export.zip'),
    // small: path.join(process.cwd(), 'data', 'small-export.zip'),
  }
} as const;

// Helper function to get test archive path
export function getTestArchivePath(archiveName: keyof typeof TEST_CONFIG.archives = 'default'): string {
  return TEST_CONFIG.archives[archiveName];
}

// Helper function to check if test archive exists
export function testArchiveExists(archiveName: keyof typeof TEST_CONFIG.archives = 'default'): boolean {
  const fs = require('fs');
  return fs.existsSync(getTestArchivePath(archiveName));
} 