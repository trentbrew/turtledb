publish:
    deno run -A scripts/build_npm.ts 0.1.0
    cd npm
    npm publish

test-prolog:
    deno test --allow-all ./tests/queries/prolog.test.ts

build:
    deno task build

# test-graph removed because core/graph.test.ts no longer exists
