<template>
  <div class="app">
    <h1>🐢 TurtleDB Vue Example</h1>

    <div class="layout">
      <!-- Sidebar -->
      <div class="sidebar">
        <GraphStats />
        <SearchPanel />
      </div>

      <!-- Main Content -->
      <div class="main">
        <NodeManager />
        <EdgeManager />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { createTurtleDBComposables } from 'turtledb'

// Create TurtleDB composables with Vue
const { useGraph, useSearch, useNodes, useEdges, useGraphStats } = createTurtleDBComposables({
  ref,
  computed,
  onUnmounted
})

// Example schema
const schema = {
  node_types: {
    person: {
      name: "person",
      description: "A person in the system",
      data: {
        name: { type: "string", required: true },
        email: { type: "string", required: false },
        role: { type: "string", enum: ["student", "teacher", "admin"] },
      },
    },
    article: {
      name: "article",
      description: "A blog post or article",
      data: {
        title: { type: "string", required: true },
        content: { type: "string", required: true },
        tags: { type: "array", required: false },
      },
    },
  },
  edge_types: {
    authored: {
      name: "authored",
      description: "Person authored an article",
      source: { node_type: "person", multiple: true, required: false },
      target: { node_type: "article", multiple: false, required: false },
      data: {
        publishedAt: { type: "string", required: false },
      },
    },
    follows: {
      name: "follows",
      description: "Person follows another person",
      source: { node_type: "person", multiple: true, required: false },
      target: { node_type: "person", multiple: false, required: false },
      data: {},
    },
  },
}
</script>

<!-- Graph Statistics Component -->
<script setup name="GraphStats">
const { stats, nodesByType, edgesByType } = useGraphStats({
  instanceId: 'example'
})
</script>

<template name="GraphStats">
  <div class="stats-panel">
    <h3>📊 Graph Statistics</h3>
    <div class="stat-grid">
      <div class="stat">
        <label>Total Nodes:</label>
        <span>{{ stats.totalNodes || 0 }}</span>
      </div>
      <div class="stat">
        <label>Total Edges:</label>
        <span>{{ stats.totalEdges || 0 }}</span>
      </div>
    </div>

    <h4>Nodes by Type</h4>
    <ul>
      <li v-for="(count, type) in nodesByType" :key="type">
        {{ type }}: {{ count }}
      </li>
    </ul>

    <h4>Edges by Type</h4>
    <ul>
      <li v-for="(count, type) in edgesByType" :key="type">
        {{ type }}: {{ count }}
      </li>
    </ul>
  </div>
</template>

<!-- Search Panel Component -->
<script setup name="SearchPanel">
const query = ref('')
const { search, results, isSearching, searchError, clearResults } = useSearch({
  instanceId: 'example'
})

const handleSearch = async () => {
  if (query.value.trim()) {
    await search(query.value, 10)
  }
}
</script>

<template name="SearchPanel">
  <div class="search-panel">
    <h3>🔍 Semantic Search</h3>
    <form @submit.prevent="handleSearch">
      <input
        v-model="query"
        type="text"
        placeholder="Search by meaning..."
        :disabled="isSearching"
      />
      <button type="submit" :disabled="isSearching">
        {{ isSearching ? 'Searching...' : 'Search' }}
      </button>
    </form>

    <div v-if="searchError" class="error">
      Error: {{ searchError.message }}
    </div>

    <div v-if="results.length > 0" class="search-results">
      <h4>Results ({{ results.length }})</h4>
      <button @click="clearResults">Clear</button>
      <ul>
        <li v-for="result in results" :key="result.node.id" class="search-result">
          <strong>{{ result.node.data.name || result.node.data.title }}</strong>
          <span class="similarity">
            {{ (result.similarity * 100).toFixed(1) }}% match
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<!-- Node Manager Component -->
<script setup name="NodeManager">
const {
  nodes,
  createNode,
  updateNode,
  deleteNode,
  isLoading,
  error
} = useGraph({
  instanceId: 'example',
  schema,
  autoLoad: true
})

const newNode = ref({
  type: 'person',
  name: '',
  email: '',
  role: 'student'
})

const handleCreateNode = async () => {
  try {
    const { type, ...data } = newNode.value
    await createNode(type, data)
    newNode.value = { type: 'person', name: '', email: '', role: 'student' }
  } catch (err) {
    console.error('Failed to create node:', err)
  }
}

const handleDeleteNode = async (id) => {
  if (confirm('Are you sure you want to delete this node?')) {
    try {
      deleteNode(id)
    } catch (err) {
      console.error('Failed to delete node:', err)
    }
  }
}
</script>

<template name="NodeManager">
  <div class="node-manager">
    <h3>👥 Node Management</h3>

    <div v-if="error" class="error">
      Error: {{ error.message }}
    </div>

    <!-- Create Node Form -->
    <form @submit.prevent="handleCreateNode" class="create-form">
      <h4>Create New Node</h4>
      <select v-model="newNode.type">
        <option value="person">Person</option>
        <option value="article">Article</option>
      </select>

      <template v-if="newNode.type === 'person'">
        <input
          v-model="newNode.name"
          type="text"
          placeholder="Name"
          required
        />
        <input
          v-model="newNode.email"
          type="email"
          placeholder="Email"
        />
        <select v-model="newNode.role">
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
      </template>

      <template v-else>
        <input
          v-model="newNode.title"
          type="text"
          placeholder="Title"
          required
        />
        <textarea
          v-model="newNode.content"
          placeholder="Content"
          required
        />
      </template>

      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Creating...' : 'Create Node' }}
      </button>
    </form>

    <!-- Node List -->
    <div class="node-list">
      <h4>Existing Nodes ({{ nodes.length }})</h4>
      <div v-for="node in nodes" :key="node.id" class="node-item">
        <div class="node-header">
          <span class="node-type">{{ node.type }}</span>
          <button @click="handleDeleteNode(node.id)" class="delete-btn">
            Delete
          </button>
        </div>
        <div class="node-data">
          <strong>{{ node.data.name || node.data.title }}</strong>
          <div v-if="node.data.email">Email: {{ node.data.email }}</div>
          <div v-if="node.data.role">Role: {{ node.data.role }}</div>
          <div v-if="node.data.content">
            Content: {{ node.data.content.substring(0, 100) }}...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- Edge Manager Component -->
<script setup name="EdgeManager">
const { edges, createEdge, deleteEdge } = useGraph({
  instanceId: 'example',
  autoLoad: false
})

const { all: nodes } = useNodes({ instanceId: 'example' })

const newEdge = ref({
  type: 'authored',
  sourceId: '',
  targetId: '',
  publishedAt: ''
})

const people = computed(() => nodes.value.filter(n => n.type === 'person'))
const articles = computed(() => nodes.value.filter(n => n.type === 'article'))

const handleCreateEdge = async () => {
  try {
    const { type, sourceId, targetId, ...data } = newEdge.value
    createEdge(type, sourceId, targetId, data)
    newEdge.value = { type: 'authored', sourceId: '', targetId: '', publishedAt: '' }
  } catch (err) {
    console.error('Failed to create edge:', err)
  }
}

const handleDeleteEdge = (id) => {
  if (confirm('Are you sure you want to delete this relationship?')) {
    try {
      deleteEdge(id)
    } catch (err) {
      console.error('Failed to delete edge:', err)
    }
  }
}

const getNodeName = (nodeId) => {
  const node = nodes.value.find(n => n.id === nodeId)
  return node?.data.name || node?.data.title || 'Unknown'
}
</script>

<template name="EdgeManager">
  <div class="edge-manager">
    <h3>🔗 Relationship Management</h3>

    <!-- Create Edge Form -->
    <form @submit.prevent="handleCreateEdge" class="create-form">
      <h4>Create New Relationship</h4>
      <select v-model="newEdge.type">
        <option value="authored">Authored</option>
        <option value="follows">Follows</option>
      </select>

      <select v-model="newEdge.sourceId" required>
        <option value="">Select source...</option>
        <option v-for="person in people" :key="person.id" :value="person.id">
          {{ person.data.name }}
        </option>
      </select>

      <select v-model="newEdge.targetId" required>
        <option value="">Select target...</option>
        <template v-if="newEdge.type === 'authored'">
          <option v-for="article in articles" :key="article.id" :value="article.id">
            {{ article.data.title }}
          </option>
        </template>
        <template v-else>
          <option v-for="person in people" :key="person.id" :value="person.id">
            {{ person.data.name }}
          </option>
        </template>
      </select>

      <input
        v-if="newEdge.type === 'authored'"
        v-model="newEdge.publishedAt"
        type="date"
      />

      <button type="submit">Create Relationship</button>
    </form>

    <!-- Edge List -->
    <div class="edge-list">
      <h4>Existing Relationships ({{ edges.length }})</h4>
      <div v-for="edge in edges" :key="edge.id" class="edge-item">
        <div class="edge-header">
          <span class="edge-type">{{ edge.type }}</span>
          <button @click="handleDeleteEdge(edge.id)" class="delete-btn">
            Delete
          </button>
        </div>
        <div class="edge-data">
          <strong>
            {{ getNodeName(edge.sourceNodeId) }} →
            {{ getNodeName(edge.targetNodeId) }}
          </strong>
          <div v-if="edge.data.publishedAt">
            Published: {{ edge.data.publishedAt }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  margin-top: 20px;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-panel, .search-panel, .node-manager, .edge-manager {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.stat {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 4px;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 6px;
}

.node-item, .edge-item {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e9ecef;
}

.node-header, .edge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.node-type, .edge-type {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.delete-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.search-result {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 4px;
  margin-bottom: 4px;
}

.similarity {
  font-size: 12px;
  color: #6c757d;
}

.error {
  background: #f8d7da;
  color: #721c24;
  padding: 8px;
  border-radius: 4px;
  margin-bottom: 10px;
}

input, select, textarea, button {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background: #007bff;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

textarea {
  min-height: 80px;
  resize: vertical;
}
</style>
