#!/usr/bin/env node

/**
 * TurtleDB GraphCore Demo - Node.js Edition
 * Comprehensive demonstration of the graph database with real embeddings
 */

import { GraphCore } from './graph-node.js'

// Define a sample schema
const schema = {
  node_types: {
    person: {
      name: 'person',
      description: 'A person in the system',
      data: {
        name: { type: 'string', required: true },
        email: { type: 'string', required: false },
        age: { type: 'number', required: false },
        role: { type: 'string', enum: ['student', 'teacher', 'admin'], required: false },
      },
    },
    project: {
      name: 'project',
      description: 'A project or initiative',
      data: {
        title: { type: 'string', required: true },
        description: { type: 'string', required: true },
        status: { type: 'string', enum: ['planning', 'active', 'completed'], required: true },
        tags: { type: 'array', required: false },
      },
    },
    document: {
      name: 'document',
      description: 'A document or file',
      data: {
        title: { type: 'string', required: true },
        content: { type: 'string', required: true },
        type: { type: 'string', enum: ['article', 'report', 'note'], required: true },
      },
    },
  },
  edge_types: {
    works_on: {
      name: 'works_on',
      description: 'Person works on a project',
      source: { node_type: 'person', multiple: true, required: false },
      target: { node_type: 'project', multiple: true, required: false },
      data: {
        role: { type: 'string', required: false },
        start_date: { type: 'string', required: false },
      },
    },
    authored: {
      name: 'authored',
      description: 'Person authored a document',
      source: { node_type: 'person', multiple: true, required: false },
      target: { node_type: 'document', multiple: false, required: false },
      data: {
        date: { type: 'string', required: false },
      },
    },
    relates_to: {
      name: 'relates_to',
      description: 'Document relates to a project',
      source: { node_type: 'document', multiple: true, required: false },
      target: { node_type: 'project', multiple: true, required: false },
      data: {
        relevance: { type: 'string', enum: ['high', 'medium', 'low'], required: false },
      },
    },
  },
}

async function main() {
  console.log('🐢 TurtleDB GraphCore Demo - Node.js Edition')
  console.log('='.repeat(60))
  console.log('Demonstrating the complete graph database with real embeddings\\n')

  try {
    // Initialize the graph with schema
    console.log('📋 Initializing GraphCore with schema...')
    const graph = new GraphCore(schema, { scanOnLoad: true })

    // Set up event listeners to show what's happening
    graph.on('node:add', (node) => {
      console.log(`  ✅ Added node: ${node.type} "${node.data.name || node.data.title}" (${node.id})`)
    })

    graph.on('edge:add', (edge) => {
      console.log(`  🔗 Added edge: ${edge.type} (${edge.sourceNodeId} → ${edge.targetNodeId})`)
    })

    console.log('\\n🏗️  Creating nodes with real embeddings...')

    // Create people
    const alice = await graph.createNode('person', {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      age: 28,
      role: 'teacher',
    })

    const bob = await graph.createNode('person', {
      name: 'Bob Smith',
      email: 'bob@example.com',
      age: 24,
      role: 'student',
    })

    const carol = await graph.createNode('person', {
      name: 'Carol Davis',
      email: 'carol@example.com',
      age: 32,
      role: 'admin',
    })

    // Create projects
    const aiProject = await graph.createNode('project', {
      title: 'AI Research Initiative',
      description:
        'Developing machine learning algorithms for natural language processing and computer vision applications',
      status: 'active',
      tags: ['AI', 'machine learning', 'research'],
    })

    const webProject = await graph.createNode('project', {
      title: 'Educational Web Platform',
      description: 'Building an interactive web platform for online education and student collaboration',
      status: 'planning',
      tags: ['web development', 'education', 'collaboration'],
    })

    const healthProject = await graph.createNode('project', {
      title: 'Healthcare Analytics',
      description: 'Analyzing patient data to improve medical diagnosis and treatment outcomes',
      status: 'active',
      tags: ['healthcare', 'analytics', 'medical'],
    })

    // Create documents
    const aiPaper = await graph.createNode('document', {
      title: 'Deep Learning for Medical Diagnosis',
      content:
        'This research paper explores the application of deep neural networks in medical imaging for automated diagnosis of diseases. We present novel architectures that achieve state-of-the-art performance in detecting cancer from radiological images.',
      type: 'article',
    })

    const webGuide = await graph.createNode('document', {
      title: 'Modern Web Development Best Practices',
      content:
        'A comprehensive guide covering modern web development practices including responsive design, accessibility, performance optimization, and user experience principles for educational platforms.',
      type: 'report',
    })

    const healthReport = await graph.createNode('document', {
      title: 'Patient Data Privacy in Healthcare Analytics',
      content:
        'This report examines the challenges and solutions for maintaining patient privacy while conducting healthcare analytics. We discuss HIPAA compliance, data anonymization techniques, and secure data processing methods.',
      type: 'report',
    })

    console.log('\\n🔗 Creating relationships...')

    // Create edges (relationships)
    graph.createEdge('works_on', alice.id, aiProject.id, {
      role: 'lead researcher',
      start_date: '2024-01-15',
    })

    graph.createEdge('works_on', bob.id, webProject.id, {
      role: 'developer',
      start_date: '2024-02-01',
    })

    graph.createEdge('works_on', carol.id, healthProject.id, {
      role: 'project manager',
      start_date: '2024-01-01',
    })

    graph.createEdge('authored', alice.id, aiPaper.id, {
      date: '2024-03-15',
    })

    graph.createEdge('authored', bob.id, webGuide.id, {
      date: '2024-03-10',
    })

    graph.createEdge('authored', carol.id, healthReport.id, {
      date: '2024-03-20',
    })

    graph.createEdge('relates_to', aiPaper.id, aiProject.id, {
      relevance: 'high',
    })

    graph.createEdge('relates_to', webGuide.id, webProject.id, {
      relevance: 'high',
    })

    graph.createEdge('relates_to', healthReport.id, healthProject.id, {
      relevance: 'high',
    })

    console.log('\\n📊 Graph Statistics:')
    const stats = graph.getStats()
    console.log(`  • Nodes: ${stats.nodes}`)
    console.log(`  • Edges: ${stats.edges}`)
    console.log(`  • Node Types: ${stats.nodeTypes}`)
    console.log(`  • Edge Types: ${stats.edgeTypes}`)
    console.log(`  • Soft Links: ${stats.softLinks}`)

    console.log('\\n🔍 Performing semantic search...')

    // Test semantic search
    const searchQueries = [
      'artificial intelligence and machine learning',
      'web development and education',
      'medical research and healthcare',
      'student collaboration platform',
    ]

    for (const query of searchQueries) {
      console.log(`\\n  🔎 Searching for: "${query}"`)
      const results = await graph.searchNodes(query, 3)

      if (results.length > 0) {
        results.forEach((result, index) => {
          const node = result.node
          const similarity = (result.similarity * 100).toFixed(1)
          const title = node.data.name || node.data.title
          console.log(`    ${index + 1}. ${node.type}: "${title}" (${similarity}% match)`)
        })
      } else {
        console.log('    No results found')
      }
    }

    console.log('\\n🔗 Generating soft links based on embeddings...')
    await graph.generateSoftLinks()

    if (graph.softLinks.length > 0) {
      console.log(`\\n  Found ${graph.softLinks.length} soft links:`)
      graph.softLinks.forEach((link, index) => {
        const sourceNode = graph.getNodes().find((n) => n.id === link.sourceId)
        const targetNode = graph.getNodes().find((n) => n.id === link.targetId)
        const score = (link.score * 100).toFixed(1)

        if (sourceNode && targetNode) {
          const sourceName = sourceNode.data.name || sourceNode.data.title
          const targetName = targetNode.data.name || targetNode.data.title
          console.log(`    ${index + 1}. "${sourceName}" ↔ "${targetName}" (${score}% similarity)`)
        }
      })
    } else {
      console.log('  No soft links generated (similarity threshold not met)')
    }

    console.log('\\n💾 Saving graph to storage...')
    await graph.save()
    console.log('  ✅ Graph saved successfully')

    console.log('\\n🧪 Testing graph reload...')
    const newGraph = new GraphCore(schema)
    await newGraph.load()
    const newStats = newGraph.getStats()
    console.log(
      `  ✅ Reloaded graph: ${newStats.nodes} nodes, ${newStats.edges} edges, ${newStats.softLinks} soft links`,
    )

    console.log('\\n🎯 Demo completed successfully!')
    console.log('\\n📈 Key Features Demonstrated:')
    console.log('  ✅ Schema validation and type safety')
    console.log('  ✅ Real embeddings with semantic understanding')
    console.log('  ✅ Automatic content enrichment (tags, descriptions)')
    console.log('  ✅ Semantic search across all content')
    console.log('  ✅ Soft link generation based on similarity')
    console.log('  ✅ Event-driven architecture')
    console.log('  ✅ Persistent storage and reload')
    console.log('  ✅ Graph statistics and analytics')
  } catch (error) {
    console.error('❌ Demo failed:', error)
    process.exit(1)
  }
}

main().catch(console.error)
