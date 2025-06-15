#!/usr/bin/env node

/**
 * Simple test for GraphCore Node.js implementation
 */

import { GraphCore } from './graph-node.js'

// Simple test schema
const testSchema = {
  node_types: {
    user: {
      name: 'user',
      description: 'A user in the system',
      data: {
        name: { type: 'string', required: true },
        email: { type: 'string', required: false },
      },
    },
    post: {
      name: 'post',
      description: 'A post or article',
      data: {
        title: { type: 'string', required: true },
        content: { type: 'string', required: true },
      },
    },
  },
  edge_types: {
    authored: {
      name: 'authored',
      description: 'User authored a post',
      source: { node_type: 'user', multiple: true, required: false },
      target: { node_type: 'post', multiple: false, required: false },
      data: {},
    },
  },
}

async function runTests() {
  console.log('🧪 Testing GraphCore Node.js Implementation')
  console.log('='.repeat(50))

  let passed = 0
  let failed = 0

  function test(name, fn) {
    try {
      fn()
      console.log(`✅ ${name}`)
      passed++
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`)
      failed++
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn()
      console.log(`✅ ${name}`)
      passed++
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`)
      failed++
    }
  }

  // Test 1: Schema validation
  test('Schema validation', () => {
    const graph = new GraphCore(testSchema)
    if (!graph.getSchema()) throw new Error('Schema not loaded')
  })

  // Test 2: Node creation
  await asyncTest('Node creation with embeddings', async () => {
    const graph = new GraphCore(testSchema)
    const user = await graph.createNode('user', {
      name: 'John Doe',
      email: 'john@example.com',
    })

    if (!user.id) throw new Error('Node ID not generated')
    if (!user.embedding) throw new Error('Embedding not generated')
    if (user.embedding.length !== 384) throw new Error('Wrong embedding dimension')
  })

  // Test 3: Edge creation
  await asyncTest('Edge creation', async () => {
    const graph = new GraphCore(testSchema)
    const user = await graph.createNode('user', { name: 'Jane Doe' })
    const post = await graph.createNode('post', {
      title: 'Hello World',
      content: 'This is my first post about programming and technology.',
    })

    const edge = graph.createEdge('authored', user.id, post.id, {})
    if (!edge.id) throw new Error('Edge ID not generated')
  })

  // Test 4: Semantic search
  await asyncTest('Semantic search', async () => {
    const graph = new GraphCore(testSchema)

    await graph.createNode('post', {
      title: 'AI and Machine Learning',
      content: 'Exploring artificial intelligence and deep learning algorithms.',
    })

    await graph.createNode('post', {
      title: 'Cooking Recipes',
      content: 'Delicious pasta recipes and cooking techniques.',
    })

    const results = await graph.searchNodes('artificial intelligence', 2)
    if (results.length === 0) throw new Error('No search results')

    // The AI post should rank higher than cooking
    const aiPost = results.find((r) => r.node.data.title.includes('AI'))
    if (!aiPost) throw new Error('AI post not found in results')
  })

  // Test 5: Save and load
  await asyncTest('Save and load', async () => {
    const graph1 = new GraphCore(testSchema)
    await graph1.createNode('user', { name: 'Test User' })
    await graph1.save()

    const graph2 = new GraphCore(testSchema)
    await graph2.load()

    const stats = graph2.getStats()
    if (stats.nodes !== 1) throw new Error('Graph not loaded correctly')
  })

  // Test 6: Schema validation errors
  test('Schema validation errors', () => {
    const graph = new GraphCore(testSchema)

    try {
      graph.addNode({
        id: 'test',
        type: 'user',
        data: {}, // Missing required 'name' field
      })
      throw new Error('Should have thrown validation error')
    } catch (error) {
      if (!error.message.includes('requires property "name"')) {
        throw new Error('Wrong validation error')
      }
    }
  })

  // Test 7: Event system
  test('Event system', () => {
    const graph = new GraphCore(testSchema)
    let eventFired = false

    graph.on('node:add', () => {
      eventFired = true
    })

    graph.addNode({
      id: 'test',
      type: 'user',
      data: { name: 'Event Test' },
    })

    if (!eventFired) throw new Error('Event not fired')
  })

  console.log('\\n📊 Test Results:')
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

  if (failed === 0) {
    console.log('\\n🎉 All tests passed! GraphCore Node.js implementation is working perfectly!')
  } else {
    console.log('\\n⚠️  Some tests failed. Please check the implementation.')
    process.exit(1)
  }
}

runTests().catch(console.error)
