# Rules for AI devs

## Publishing Steps
When publishing, follow these steps in order:

Build and test: npm run build && npm test
Commit changes with scope prefix and description; e.g `feat(cool-feature): make it work` or `docs: add important info about X`
Push changes: git push
Create patch version: npm version patch
Push tags: git push --tags
Publish: npm publish