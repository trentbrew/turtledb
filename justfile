publish:
    deno run -A scripts/build_npm.ts 0.1.0
    cd npm
    npm publish
