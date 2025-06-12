// ex. scripts/build_npm.ts
import { build, emptyDir } from '@deno/dnt'

await emptyDir('./npm')

await build({
  entryPoints: ['./main.ts'],
  outDir: './npm',
  shims: {
    // see JS docs for overview and more options
    deno: false,
  },
  package: {
    // package.json properties
    name: 'framework-agnostic-graph',
    version: '0.1.0',
    description: 'Framework-agnostic graph data layer (nodes, edges, CRUD, events) for JS/TS projects.',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'https://github.com/username/repo.git',
    },
    bugs: {
      url: 'https://github.com/username/repo/issues',
    },
    keywords: ['graph', 'data', 'typescript', 'framework-agnostic', 'nodes', 'edges', 'event-emitter', 'crud'],
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync('LICENSE', 'npm/LICENSE')
    Deno.copyFileSync('README.md', 'npm/README.md')
  },
})
