# TurtleDB Justfile - Node.js Edition
# Run `just --list` to see all available commands

# Default recipe - show help
default:
    @just --list

# Install dependencies
install:
    npm install

# Build the project
build:
    npm run build

# Run tests
test:
    npm test

# Run tests with coverage
test-coverage:
    npm run test -- --coverage

# Development mode with file watching
dev:
    npm run dev

# Run the demo
demo:
    node test-embeddings-node.js

# Run the Node.js embeddings demo
demo-node:
    node demo-node.js

# Run the full GraphCore demo
demo-graph:
    node graph-demo-node.js

# Test the GraphCore implementation
test-graph:
    node test-graph-node.js

# Clean build artifacts
clean:
    rm -rf dist/
    rm -rf node_modules/.cache/

# Format code (if we add prettier)
format:
    npx prettier --write "**/*.{ts,js,json,md}"

# Lint code (if we add eslint)
lint:
    npx eslint "**/*.{ts,js}"

# Type check
typecheck:
    npx tsc --noEmit

# Install and setup development environment
setup: install
    @echo "✅ TurtleDB development environment ready!"
    @echo "Run 'just demo' to test embeddings"
    @echo "Run 'just test' to run the test suite"
    @echo "Run 'just dev' for development mode"

# Publish to npm (when ready)
publish:
    npm run build
    npm publish

# Show project status
status:
    @echo "🐢 TurtleDB Status"
    @echo "=================="
    @echo "Node.js version: $(node --version)"
    @echo "NPM version: $(npm --version)"
    @echo "Dependencies:"
    @npm list --depth=0
    @echo ""
    @echo "Build status:"
    @if [ -d "dist" ]; then echo "✅ Built"; else echo "❌ Not built"; fi
    @echo ""
    @echo "Test status:"
    @npm test --silent > /dev/null 2>&1 && echo "✅ Tests passing" || echo "❌ Tests failing"
