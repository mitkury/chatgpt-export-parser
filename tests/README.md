# Tests

This directory contains all test files for the ChatGPT Export Parser.

## Files

- **`parser.test.ts`** - Main test suite covering all parser functionality
- **`test-config.ts`** - Test configuration and helper functions
- **`example-conversation.json`** - Sample conversation with branch for testing

## Test Coverage

The test suite covers:

- ✅ Basic parsing of ChatGPT export archives
- ✅ System messages handling
- ✅ Safe URLs and attachments
- ✅ Archived conversations
- ✅ Tool messages
- ✅ Rich metadata preservation
- ✅ Long conversations
- ✅ Different languages
- ✅ Branched conversations
- ✅ Tree structure building
- ✅ Branch identification
- ✅ Parent-child relationships
- ✅ Content extraction
- ✅ Metadata preservation

## Running Tests

```bash
npm test          # Run tests in watch mode
npm run test:run  # Run tests once
```

## Test Configuration

The `test-config.ts` file provides:
- Centralized test archive path management
- Helper functions for test data access
- Easy configuration for multiple test archives

## Example Conversation

The `example-conversation.json` file contains a realistic ChatGPT conversation with a branch scenario:

```
msg-1 (system) 
  ↓
msg-2 (user) 
  ↓
msg-3 (assistant) ← BRANCH POINT
  ├─ msg-4 (user) → msg-6 (assistant) ← ACTIVE PATH
  └─ msg-5 (user) ← ABANDONED BRANCH
```

This tests our parser's ability to handle branched conversations correctly. 