#!/usr/bin/env node

/**
 * TurtleDB Node.js Demo with Real Embeddings
 * This demonstrates the complete graph database with real transformer-based embeddings
 */

// Note: This will need to be updated once we compile the TypeScript
// For now, let's create a simple demo that works with our current setup

import { getEmbedding, isRealEmbeddingsAvailable, cosineSimilarity } from './embeddings-node.js'

async function main() {
  console.log('🐢 TurtleDB Node.js Demo with Real Embeddings\\n')

  // Check if real embeddings are available
  console.log('Checking embedding availability...')
  const hasRealEmbeddings = await isRealEmbeddingsAvailable()
  console.log(`Real embeddings available: ${hasRealEmbeddings ? '✅' : '❌'}\\n`)

  // Test embeddings with different types of content
  console.log('Testing semantic similarity with real embeddings...\\n')

  try {
    // AI/Tech related content
    console.log('🤖 Generating embeddings for AI/Tech content...')
    const aiEmbedding1 = await getEmbedding('artificial intelligence machine learning neural networks')
    const aiEmbedding2 = await getEmbedding('software engineering programming algorithms')

    // Medical content
    console.log('🏥 Generating embeddings for Medical content...')
    const medEmbedding1 = await getEmbedding('medical doctor healthcare patient treatment')
    const medEmbedding2 = await getEmbedding('cardiology heart disease surgery')

    // Food content
    console.log('🍎 Generating embeddings for Food content...')
    const foodEmbedding1 = await getEmbedding('banana apple fruit grocery store')
    const foodEmbedding2 = await getEmbedding('restaurant cooking recipe ingredients')

    console.log('\\n📊 Similarity Analysis:')
    console.log('========================')

    // Within-category similarities (should be higher)
    const aiSimilarity = cosineSimilarity(aiEmbedding1, aiEmbedding2)
    const medSimilarity = cosineSimilarity(medEmbedding1, medEmbedding2)
    const foodSimilarity = cosineSimilarity(foodEmbedding1, foodEmbedding2)

    console.log(`\\n🔗 Within-Category Similarities:`)
    console.log(`   AI/Tech:     ${aiSimilarity.toFixed(4)}`)
    console.log(`   Medical:     ${medSimilarity.toFixed(4)}`)
    console.log(`   Food:        ${foodSimilarity.toFixed(4)}`)

    // Cross-category similarities (should be lower)
    const aiMedSimilarity = cosineSimilarity(aiEmbedding1, medEmbedding1)
    const aiFoodSimilarity = cosineSimilarity(aiEmbedding1, foodEmbedding1)
    const medFoodSimilarity = cosineSimilarity(medEmbedding1, foodEmbedding1)

    console.log(`\\n🔀 Cross-Category Similarities:`)
    console.log(`   AI ↔ Medical:   ${aiMedSimilarity.toFixed(4)}`)
    console.log(`   AI ↔ Food:      ${aiFoodSimilarity.toFixed(4)}`)
    console.log(`   Medical ↔ Food: ${medFoodSimilarity.toFixed(4)}`)

    console.log('\\n✅ Semantic similarity test completed!')
    console.log('\\n🎯 Next: Once TypeScript is compiled, we can test the full graph functionality')
  } catch (error) {
    console.error('❌ Error during demo:', error)
  }
}

main().catch(console.error)
