import {
  assert,
  assertEquals,
  assertThrows,
} from 'https://deno.land/std@0.140.0/testing/asserts.ts';
import { GraphCore } from '../../core/graph.ts';
import { schema } from '../../demo/schema.example.ts';
import type { Node } from '../../types/index.ts';

Deno.test('GraphCore - Initialization', () => {
  console.log('Initializing GraphCore with schema...');
  const graph = new GraphCore(schema);
  assertEquals(
    graph.getSchema(),
    schema,
    'Graph should be initialized with the schema.',
  );
  console.log('Graph schema after init:', graph.getSchema());
  console.log('✓ GraphCore - Initialization');
});

Deno.test('GraphCore - Node CRUD & Validation', () => {
  const graph = new GraphCore(schema);

  console.log('Creating member node...');
  const member = graph.createNode('member', {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    isActive: true,
  });
  console.log('Created node:', member);
  assertEquals(graph.getNodes().length, 1);
  console.log('All nodes after creation:', graph.getNodes());
  console.log('✓ Node Creation');

  // 2. Attempt to create a node with an invalid type
  console.log('Attempting to create node with invalid type...');
  assertThrows(
    () => {
      graph.createNode('invalid_type', { foo: 'bar' });
    },
    Error,
    'Node type "invalid_type" is not defined in the schema.',
    'Should throw for invalid node type',
  );
  console.log('Invalid type test passed.');
  console.log('✓ Node Invalid Type Validation');

  // 3. Update a node
  console.log('Updating node:', member.id);
  graph.updateNode(member.id, {
    data: {
      lastName: 'Jones',
    },
  });
  const updatedNode = graph.getNodes()[0];
  console.log('Updated node:', updatedNode);
  assertEquals(updatedNode.data.lastName, 'Jones');
  console.log('✓ Node Update');

  // 4. Delete a node
  console.log('Deleting node:', member.id);
  graph.deleteNode(member.id);
  console.log('All nodes after deletion:', graph.getNodes());
  assertEquals(graph.getNodes().length, 0);
  console.log('✓ Node Deletion');
});

Deno.test('GraphCore - Edge CRUD & Validation', () => {
  const graph = new GraphCore(schema);
  const author = graph.createNode('author', {
    firstName: 'Carol',
    lastName: 'Johnson',
    email: 'carol@example.com',
    isActive: true,
  });
  const publication = graph.createNode('publication', {
    title: 'Graphs 101',
    content: '...',
    published: true,
  });

  console.log('Creating edge: wrote');
  const edge = graph.createEdge('wrote', author.id, publication.id, {});
  console.log('Created edge:', edge);
  assertEquals(graph.getEdges().length, 1);
  console.log('All edges after creation:', graph.getEdges());
  console.log('✓ Edge Creation');

  // 2. Attempt to create an edge with an invalid type
  console.log('Attempting to create edge with invalid type...');
  assertThrows(
    () => {
      graph.createEdge('invalid_edge', author.id, publication.id, {});
    },
    Error,
    'Edge type "invalid_edge" is not defined in the schema.',
    'Should throw for invalid edge type',
  );
  console.log('Invalid edge type test passed.');
  console.log('✓ Edge Invalid Type Validation');

  // 3. Attempt to create an edge with wrong target type
  console.log('Attempting to create edge with wrong target type...');
  assertThrows(
    () => {
      // 'wrote' edge must have a 'publication' target
      graph.createEdge('wrote', author.id, author.id, {});
    },
    Error,
    'requires target node of type "publication"',
  );
  console.log('Invalid target type test passed.');
  console.log('✓ Edge Invalid Target Type Validation');

  // 4. Test cascading delete
  console.log('Deleting node (should cascade edges):', author.id);
  graph.deleteNode(author.id);
  console.log('All nodes after cascade:', graph.getNodes());
  console.log('All edges after cascade:', graph.getEdges());
  assertEquals(graph.getNodes().length, 1); // publication remains
  assertEquals(
    graph.getEdges().length,
    0,
    'Edges connected to deleted node should be removed',
  );
  console.log('✓ Edge Cascade Deletion');
});

Deno.test('GraphCore - Property Validation', () => {
  const graph = new GraphCore(schema);

  // Node property validation
  console.log('Testing missing required property for node...');
  assertThrows(
    () => {
      graph.createNode('member', { firstName: 'Missing' }); // Missing lastName, email, isActive
    },
    Error,
    "Missing required property 'lastName'",
  );
  console.log('Missing property test passed.');

  console.log('Testing invalid type for node property...');
  assertThrows(
    () => {
      graph.createNode('member', {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@test.com',
        isActive: 'yes', // Should be boolean
      });
    },
    Error,
    'Invalid type for property',
  );
  console.log('Invalid property type test passed.');

  console.log('Testing extra property for node...');
  assertThrows(
    () => {
      graph.createNode('member', {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        isActive: true,
        extra: 'field',
      }); // Extra property
    },
    Error,
    "Unknown property 'extra' found on node type 'member'.",
    'Should throw for extra node property',
  );
  console.log('Extra property test passed.');
  console.log('✓ Node Property Validation');

  // Edge property validation for 'wrote' edge is not applicable as it has no data properties in the schema.
});

Deno.test('GraphCore - Event Emission', () => {
  const graph = new GraphCore(schema);
  let eventPayload: any = null;

  console.log('Registering event handler for node:add...');
  graph.on('node:add', (payload) => {
    eventPayload = payload;
    console.log('node:add event payload:', payload);
  });

  console.log('Creating member node to trigger node:add event...');
  const member = graph.createNode('member', {
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    isActive: true,
  });
  assertEquals(eventPayload.id, member.id);
  console.log('✓ Event: node:add');

  console.log('Updating member node to trigger node:update event...');
  graph.on('node:update', (payload) => {
    eventPayload = payload.node;
    console.log('node:update event payload:', payload.node);
  });
  graph.updateNode(member.id, { data: { lastName: 'Jones' } });
  assertEquals(eventPayload.data.lastName, 'Jones');
  console.log('✓ Event: node:update');

  const author = graph.createNode('author', {
    firstName: 'Carol',
    lastName: 'Johnson',
    email: 'carol@example.com',
    isActive: true,
  });
  const publication = graph.createNode('publication', {
    title: 'Graphs 101',
    content: '...',
    published: true,
  });
  const edge = graph.createEdge('wrote', author.id, publication.id, {});

  console.log('Deleting edge to trigger edge:delete event...');
  graph.on('edge:delete', (payload) => {
    eventPayload = payload;
    console.log('edge:delete event payload (edgeId):', payload);
  });
  graph.deleteEdge(edge.id);
  assertEquals(eventPayload, edge.id);
  console.log('✓ Event: edge:delete');
});
