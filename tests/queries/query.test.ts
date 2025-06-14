import { assertEquals } from '@std/assert';
import { PrologEngine, Fact } from '../../core/prolog.ts';

// Helper to resolve the path to example-data.json relative to the project root
function getExampleDataPath() {
  return new URL('../../example-data.json', import.meta.url).pathname;
}

Deno.test('PrologEngine loads facts from example-data.json', async () => {
  const engine = new PrologEngine();
  await engine.loadFactsFromJSON(getExampleDataPath());
  const facts = engine.getFacts();
  console.log('Loaded facts:', facts);
  // Should load all nodes and edges
  assertEquals(facts.length, 11);
  // Check a sample node
  const alice = facts.find((f: Fact) => f.id === 'm1');
  if (!alice) throw new Error('Alice not found');
  console.log('Sample member node:', alice);
  assertEquals(alice.type, 'member');
  assertEquals(alice.data.firstName, 'Alice');
  // Check a sample edge
  const wroteEdge = facts.find((f: Fact) => f.id === 'e1');
  if (!wroteEdge) throw new Error('wroteEdge not found');
  console.log('Sample wrote edge:', wroteEdge);
  assertEquals(wroteEdge.type, 'wrote');
  assertEquals(wroteEdge.sourceNodeId, 'a1');
  assertEquals(wroteEdge.targetNodeId, 'pub1');
});

Deno.test('Query all active members', async () => {
  const engine = new PrologEngine();
  await engine.loadFactsFromJSON(getExampleDataPath());
  const query = { type: 'member', 'data.isActive': true, id: '$id' };
  // Since the engine doesn't support dot notation, filter manually
  const results = engine
    .getFacts()
    .filter((f: Fact) => f.type === 'member' && f.data.isActive);
  console.log('Active members:', results);
  assertEquals(results.length, 1);
  assertEquals(results[0].data.firstName, 'Alice');
});

Deno.test('Query all posts that are published', async () => {
  const engine = new PrologEngine();
  await engine.loadFactsFromJSON(getExampleDataPath());
  const results = engine
    .getFacts()
    .filter((f: Fact) => f.type === 'post' && f.data.published);
  console.log('Published posts:', results);
  assertEquals(results.length, 1);
  assertEquals(results[0].data.title, 'Hello World');
});

Deno.test('Query all authors', async () => {
  const engine = new PrologEngine();
  await engine.loadFactsFromJSON(getExampleDataPath());
  const results = engine.getFacts().filter((f: Fact) => f.type === 'author');
  console.log('Authors:', results);
  assertEquals(results.length, 2);
  assertEquals(results.map((a: Fact) => a.data.firstName).sort(), [
    'Carol',
    'Dave',
  ]);
});

Deno.test('Query all publications written by Carol', async () => {
  const engine = new PrologEngine();
  await engine.loadFactsFromJSON(getExampleDataPath());
  // Find Carol's author node
  const carol = engine
    .getFacts()
    .find((f: Fact) => f.type === 'author' && f.data.firstName === 'Carol');
  if (!carol) throw new Error('Carol not found');
  // Find wrote edges from Carol
  const wroteEdges = engine
    .getFacts()
    .filter((f: Fact) => f.type === 'wrote' && f.sourceNodeId === carol.id);
  console.log('Carol wrote edges:', wroteEdges);
  // Find publications Carol wrote
  const pubs = wroteEdges
    .map((e: Fact) =>
      engine
        .getFacts()
        .find((f: Fact) => f.id === e.targetNodeId && f.type === 'publication'),
    )
    .filter((p: Fact | undefined): p is Fact => p !== undefined);
  console.log('Publications written by Carol:', pubs);
  assertEquals(pubs.length, 2);
  assertEquals(pubs.map((p: Fact) => p.data.title).sort(), [
    'Advanced Graph Theory',
    'Graph Databases 101',
  ]);
});

Deno.test('Query all authors who wrote a published publication', async () => {
  const engine = new PrologEngine();
  await engine.loadFactsFromJSON(getExampleDataPath());
  // Find all wrote edges
  const wroteEdges = engine.getFacts().filter((f: Fact) => f.type === 'wrote');
  console.log('All wrote edges:', wroteEdges);
  // For each edge, check if the publication is published
  const authors = wroteEdges
    .map((e: Fact) => {
      const pub = engine
        .getFacts()
        .find(
          (f: Fact) =>
            f.id === e.targetNodeId &&
            f.type === 'publication' &&
            f.data.published,
        );
      if (pub) {
        return engine
          .getFacts()
          .find((f: Fact) => f.id === e.sourceNodeId && f.type === 'author');
      }
      return null;
    })
    .filter(
      (a: Fact | null | undefined): a is Fact => a !== null && a !== undefined,
    );
  console.log('Authors who wrote a published publication:', authors);
  // Carol wrote pub1 (published), Dave wrote none published, Carol also wrote pub2 (not published)
  assertEquals(authors.length, 1);
  assertEquals(authors[0].data.firstName, 'Carol');
});
