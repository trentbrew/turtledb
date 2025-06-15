#!/usr/bin/env node

/**
 * Test the main entry point for external imports
 */

import { GraphCore, getEmbedding, validateSchema } from './index.js'

async function testEntryPoint() {
  console.log('🧪 Testing TurtleDB Entry Point')
  console.log('='.repeat(40))

  try {
    // Test schema
    const schema = {
      node_types: {
        test: {
          name: 'test',
          description: 'Test node',
          data: {
            name: { type: 'string', required: true },
          },
        },
      },
      edge_types: {},
    }

    // Test schema validation
    validateSchema(schema)
    console.log('✅ Schema validation works')

    // Test GraphCore
    const graph = new GraphCore(schema)
    console.log('✅ GraphCore instantiation works')

    // Test embedding
    const embedding = await getEmbedding('test text')
    console.log(`✅ Embedding generation works (${embedding.length} dimensions)`)

    // Test node creation
    const node = await graph.createNode('test', { name: 'Test Node' })
    console.log(`✅ Node creation works (ID: ${node.id})`)

    console.log('\n🎉 Entry point is working perfectly!')
    console.log('\n📦 Your Svelte project can now import like this:')
    console.log("   import { GraphCore } from 'turtle-db'")
    console.log('   // or')
    console.log("   import { GraphCore, getEmbedding } from 'turtle-db'")
  } catch (error) {
    console.error('❌ Entry point test failed:', error)
    process.exit(1)
  }
}

testEntryPoint()
