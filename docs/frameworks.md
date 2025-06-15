# 🎯 Framework Integration Guide

TurtleDB is designed to work seamlessly with any JavaScript framework. This
guide shows you how to integrate TurtleDB with popular frameworks and build
reactive, semantic-powered applications.

## 🎨 Design Principles

TurtleDB's framework integration follows these principles:

- **Framework Agnostic Core** - The same GraphCore works everywhere
- **Reactive by Design** - Built-in event system for real-time updates
- **Composable Patterns** - Reusable hooks and utilities
- **Type Safety** - Full TypeScript support across all frameworks
- **Performance First** - Optimized for production applications

## ⚛️ React Integration

### Basic Setup

```javascript
// hooks/useGraph.js
import { useCallback, useEffect, useState } from "react";
import { GraphCore } from "turtle-db";

export function useGraph(schema, options = {}) {
  const [graph] = useState(() => new GraphCore(schema, options));
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update state when graph changes
  const updateState = useCallback(() => {
    setNodes([...graph.getNodes()]);
    setEdges([...graph.getEdges()]);
  }, [graph]);

  useEffect(() => {
    // Set up event listeners
    const handlers = {
      "node:add": updateState,
      "node:update": updateState,
      "node:delete": updateState,
      "edge:add": updateState,
      "edge:update": updateState,
      "edge:delete": updateState,
      "graph:clear": updateState,
    };

    Object.entries(handlers).forEach(([event, handler]) => {
      graph.on(event, handler);
    });

    // Load existing data
    graph.load().then(() => {
      updateState();
      setLoading(false);
    });

    // Cleanup
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        graph.off(event, handler);
      });
    };
  }, [graph, updateState]);

  return {
    graph,
    nodes,
    edges,
    loading,
    refresh: updateState,
  };
}
```

### Search Hook

```javascript
// hooks/useSearch.js
import { useCallback, useState } from "react";

export function useSearch(graph) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const search = useCallback(async (searchQuery, limit = 10) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setQuery(searchQuery);

    try {
      const searchResults = await graph.searchNodes(searchQuery, limit);
      setResults(searchResults);
    } catch (error) {
      console.error("Search failed:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [graph]);

  const clear = useCallback(() => {
    setResults([]);
    setQuery("");
  }, []);

  return {
    results,
    loading,
    query,
    search,
    clear,
  };
}
```

### Complete React Example

```javascript
// App.js
import React from "react";
import { useGraph, useSearch } from "./hooks";
import { CreateNodeForm, NodeList, SearchBar } from "./components";

const schema = {
  node_types: {
    article: {
      name: "article",
      description: "A blog article",
      data: {
        title: { type: "string", required: true },
        content: { type: "string", required: true },
        category: { type: "string", required: true },
      },
    },
  },
  edge_types: {},
};

function App() {
  const { graph, nodes, loading } = useGraph(schema);
  const { results, search, clear } = useSearch(graph);

  if (loading) {
    return <div>Loading graph...</div>;
  }

  return (
    <div className="app">
      <h1>TurtleDB React Demo</h1>

      <SearchBar onSearch={search} onClear={clear} />

      {results.length > 0
        ? (
          <div>
            <h2>Search Results</h2>
            <NodeList nodes={results.map((r) => r.node)} />
          </div>
        )
        : (
          <div>
            <h2>All Articles ({nodes.length})</h2>
            <NodeList nodes={nodes} />
          </div>
        )}

      <CreateNodeForm graph={graph} />
    </div>
  );
}

export default App;
```

### React Components

```javascript
// components/SearchBar.js
import React, { useState } from "react";

export function SearchBar({ onSearch, onClear }) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles by meaning..."
        className="search-input"
      />
      <button type="submit">Search</button>
      <button type="button" onClick={handleClear}>Clear</button>
    </form>
  );
}

// components/NodeList.js
import React from "react";

export function NodeList({ nodes }) {
  return (
    <div className="node-list">
      {nodes.map((node) => (
        <div key={node.id} className="node-card">
          <h3>{node.data.title}</h3>
          <p>{node.data.content.substring(0, 200)}...</p>
          <span className="category">{node.data.category}</span>
        </div>
      ))}
    </div>
  );
}

// components/CreateNodeForm.js
import React, { useState } from "react";

export function CreateNodeForm({ graph }) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "technology",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await graph.createNode("article", formData);
      setFormData({ title: "", content: "", category: "technology" });
    } catch (error) {
      console.error("Failed to create article:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-form">
      <h3>Create New Article</h3>

      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Article title"
        required
      />

      <textarea
        value={formData.content}
        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
        placeholder="Article content"
        required
      />

      <select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
      >
        <option value="technology">Technology</option>
        <option value="science">Science</option>
        <option value="business">Business</option>
      </select>

      <button type="submit">Create Article</button>
    </form>
  );
}
```

## 🟢 Vue 3 Integration

### Composable Setup

```javascript
// composables/useGraph.js
import { onMounted, onUnmounted, ref } from "vue";
import { GraphCore } from "turtle-db";

export function useGraph(schema, options = {}) {
  const graph = new GraphCore(schema, options);
  const nodes = ref([]);
  const edges = ref([]);
  const loading = ref(true);

  const updateState = () => {
    nodes.value = graph.getNodes();
    edges.value = graph.getEdges();
  };

  const handlers = {
    "node:add": updateState,
    "node:update": updateState,
    "node:delete": updateState,
    "edge:add": updateState,
    "edge:update": updateState,
    "edge:delete": updateState,
    "graph:clear": updateState,
  };

  onMounted(async () => {
    // Set up event listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      graph.on(event, handler);
    });

    // Load existing data
    await graph.load();
    updateState();
    loading.value = false;
  });

  onUnmounted(() => {
    Object.entries(handlers).forEach(([event, handler]) => {
      graph.off(event, handler);
    });
  });

  return {
    graph,
    nodes,
    edges,
    loading,
    refresh: updateState,
  };
}
```

### Search Composable

```javascript
// composables/useSearch.js
import { ref } from "vue";

export function useSearch(graph) {
  const results = ref([]);
  const loading = ref(false);
  const query = ref("");

  const search = async (searchQuery, limit = 10) => {
    if (!searchQuery.trim()) {
      results.value = [];
      return;
    }

    loading.value = true;
    query.value = searchQuery;

    try {
      const searchResults = await graph.searchNodes(searchQuery, limit);
      results.value = searchResults;
    } catch (error) {
      console.error("Search failed:", error);
      results.value = [];
    } finally {
      loading.value = false;
    }
  };

  const clear = () => {
    results.value = [];
    query.value = "";
  };

  return {
    results,
    loading,
    query,
    search,
    clear,
  };
}
```

### Vue Component Example

```vue
<!-- App.vue -->
<template>
  <div class="app">
    <h1>TurtleDB Vue Demo</h1>

    <SearchBar @search="handleSearch" @clear="handleClear" />

    <div v-if="searchResults.length > 0">
      <h2>Search Results</h2>
      <NodeList :nodes="searchResults.map(r => r.node)" />
    </div>

    <div v-else>
      <h2>All Articles ({{ nodes.length }})</h2>
      <NodeList :nodes="nodes" />
    </div>

    <CreateNodeForm :graph="graph" />
  </div>
</template>

<script setup>
import { useGraph, useSearch } from './composables';
import SearchBar from './components/SearchBar.vue';
import NodeList from './components/NodeList.vue';
import CreateNodeForm from './components/CreateNodeForm.vue';

const schema = {
  node_types: {
    article: {
      name: 'article',
      description: 'A blog article',
      data: {
        title: { type: 'string', required: true },
        content: { type: 'string', required: true },
        category: { type: 'string', required: true }
      }
    }
  },
  edge_types: {}
};

const { graph, nodes, loading } = useGraph(schema);
const { results: searchResults, search, clear } = useSearch(graph);

const handleSearch = (query) => {
  search(query);
};

const handleClear = () => {
  clear();
};
</script>
```

### Vue Components

```vue
<!-- components/SearchBar.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="search-bar">
    <input
      v-model="query"
      type="text"
      placeholder="Search articles by meaning..."
      class="search-input"
    />
    <button type="submit">Search</button>
    <button type="button" @click="handleClear">Clear</button>
  </form>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['search', 'clear']);
const query = ref('');

const handleSubmit = () => {
  emit('search', query.value);
};

const handleClear = () => {
  query.value = '';
  emit('clear');
};
</script>

<!-- components/NodeList.vue -->
<template>
  <div class="node-list">
    <div v-for="node in nodes" :key="node.id" class="node-card">
      <h3>{{ node.data.title }}</h3>
      <p>{{ node.data.content.substring(0, 200) }}...</p>
      <span class="category">{{ node.data.category }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps(['nodes']);
</script>

<!-- components/CreateNodeForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="create-form">
    <h3>Create New Article</h3>

    <input
      v-model="formData.title"
      type="text"
      placeholder="Article title"
      required
    />

    <textarea
      v-model="formData.content"
      placeholder="Article content"
      required
    ></textarea>

    <select v-model="formData.category">
      <option value="technology">Technology</option>
      <option value="science">Science</option>
      <option value="business">Business</option>
    </select>

    <button type="submit">Create Article</button>
  </form>
</template>

<script setup>
import { reactive } from 'vue';

const props = defineProps(['graph']);

const formData = reactive({
  title: '',
  content: '',
  category: 'technology'
});

const handleSubmit = async () => {
  try {
    await props.graph.createNode('article', { ...formData });
    Object.assign(formData, { title: '', content: '', category: 'technology' });
  } catch (error) {
    console.error('Failed to create article:', error);
  }
};
</script>
```

## 🔥 Svelte Integration

### Store Setup

```javascript
// stores/graph.js
import { derived, writable } from "svelte/store";
import { GraphCore } from "turtle-db";

export function createGraphStore(schema, options = {}) {
  const graph = new GraphCore(schema, options);

  // Core stores
  const nodes = writable([]);
  const edges = writable([]);
  const loading = writable(true);

  // Search stores
  const searchResults = writable([]);
  const searchQuery = writable("");
  const searchLoading = writable(false);

  // Update function
  const updateState = () => {
    nodes.set(graph.getNodes());
    edges.set(graph.getEdges());
  };

  // Event handlers
  const handlers = {
    "node:add": updateState,
    "node:update": updateState,
    "node:delete": updateState,
    "edge:add": updateState,
    "edge:update": updateState,
    "edge:delete": updateState,
    "graph:clear": updateState,
  };

  // Initialize
  const initialize = async () => {
    // Set up event listeners
    Object.entries(handlers).forEach(([event, handler]) => {
      graph.on(event, handler);
    });

    // Load existing data
    await graph.load();
    updateState();
    loading.set(false);
  };

  // Search function
  const search = async (query, limit = 10) => {
    if (!query.trim()) {
      searchResults.set([]);
      return;
    }

    searchLoading.set(true);
    searchQuery.set(query);

    try {
      const results = await graph.searchNodes(query, limit);
      searchResults.set(results);
    } catch (error) {
      console.error("Search failed:", error);
      searchResults.set([]);
    } finally {
      searchLoading.set(false);
    }
  };

  const clearSearch = () => {
    searchResults.set([]);
    searchQuery.set("");
  };

  // Cleanup function
  const destroy = () => {
    Object.entries(handlers).forEach(([event, handler]) => {
      graph.off(event, handler);
    });
  };

  // Derived stores
  const stats = derived(
    [nodes, edges],
    ([$nodes, $edges]) => ({
      nodeCount: $nodes.length,
      edgeCount: $edges.length,
      nodeTypes: [...new Set($nodes.map((n) => n.type))].length,
    }),
  );

  // Initialize on creation
  initialize();

  return {
    // Core stores
    nodes,
    edges,
    loading,
    stats,

    // Search stores
    searchResults,
    searchQuery,
    searchLoading,

    // Methods
    graph,
    search,
    clearSearch,
    refresh: updateState,
    destroy,
  };
}
```

### Svelte App Example

```svelte
<!-- App.svelte -->
<script>
  import { onDestroy } from 'svelte';
  import { createGraphStore } from './stores/graph.js';
  import SearchBar from './components/SearchBar.svelte';
  import NodeList from './components/NodeList.svelte';
  import CreateNodeForm from './components/CreateNodeForm.svelte';

  const schema = {
    node_types: {
      article: {
        name: 'article',
        description: 'A blog article',
        data: {
          title: { type: 'string', required: true },
          content: { type: 'string', required: true },
          category: { type: 'string', required: true }
        }
      }
    },
    edge_types: {}
  };

  const store = createGraphStore(schema);
  const {
    nodes,
    loading,
    searchResults,
    searchQuery,
    stats,
    search,
    clearSearch,
    graph
  } = store;

  onDestroy(() => {
    store.destroy();
  });

  $: displayNodes = $searchResults.length > 0
    ? $searchResults.map(r => r.node)
    : $nodes;
</script>

<main class="app">
  <h1>TurtleDB Svelte Demo</h1>

  {#if $loading}
    <p>Loading graph...</p>
  {:else}
    <div class="stats">
      <span>Nodes: {$stats.nodeCount}</span>
      <span>Edges: {$stats.edgeCount}</span>
      <span>Types: {$stats.nodeTypes}</span>
    </div>

    <SearchBar on:search={(e) => search(e.detail)} on:clear={clearSearch} />

    {#if $searchResults.length > 0}
      <h2>Search Results for "{$searchQuery}"</h2>
    {:else}
      <h2>All Articles ({$nodes.length})</h2>
    {/if}

    <NodeList nodes={displayNodes} />

    <CreateNodeForm {graph} />
  {/if}
</main>

<style>
  .app {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  .stats {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    padding: 10px;
    background: #f5f5f5;
    border-radius: 5px;
  }
</style>
```

### Svelte Components

```svelte
<!-- components/SearchBar.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let query = '';

  function handleSubmit() {
    dispatch('search', query);
  }

  function handleClear() {
    query = '';
    dispatch('clear');
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="search-bar">
  <input
    bind:value={query}
    type="text"
    placeholder="Search articles by meaning..."
    class="search-input"
  />
  <button type="submit">Search</button>
  <button type="button" on:click={handleClear}>Clear</button>
</form>

<style>
  .search-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  .search-input {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }
</style>

<!-- components/NodeList.svelte -->
<script>
  export let nodes = [];
</script>

<div class="node-list">
  {#each nodes as node (node.id)}
    <div class="node-card">
      <h3>{node.data.title}</h3>
      <p>{node.data.content.substring(0, 200)}...</p>
      <span class="category">{node.data.category}</span>
    </div>
  {/each}
</div>

<style>
  .node-list {
    display: grid;
    gap: 15px;
  }

  .node-card {
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background: white;
  }

  .category {
    display: inline-block;
    padding: 2px 8px;
    background: #007acc;
    color: white;
    border-radius: 3px;
    font-size: 0.8em;
  }
</style>

<!-- components/CreateNodeForm.svelte -->
<script>
  export let graph;

  let formData = {
    title: '',
    content: '',
    category: 'technology'
  };

  async function handleSubmit() {
    try {
      await graph.createNode('article', { ...formData });
      formData = { title: '', content: '', category: 'technology' };
    } catch (error) {
      console.error('Failed to create article:', error);
    }
  }
</script>

<form on:submit|preventDefault={handleSubmit} class="create-form">
  <h3>Create New Article</h3>

  <input
    bind:value={formData.title}
    type="text"
    placeholder="Article title"
    required
  />

  <textarea
    bind:value={formData.content}
    placeholder="Article content"
    required
  ></textarea>

  <select bind:value={formData.category}>
    <option value="technology">Technology</option>
    <option value="science">Science</option>
    <option value="business">Business</option>
  </select>

  <button type="submit">Create Article</button>
</form>

<style>
  .create-form {
    margin-top: 30px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background: #f9f9f9;
  }

  .create-form input,
  .create-form textarea,
  .create-form select {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
  }

  .create-form textarea {
    height: 100px;
    resize: vertical;
  }
</style>
```

## 🟨 Vanilla JavaScript Integration

### Simple Setup

```javascript
// graph-manager.js
import { GraphCore } from "turtle-db";

class GraphManager {
  constructor(schema, options = {}) {
    this.graph = new GraphCore(schema, options);
    this.listeners = new Map();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const events = [
      "node:add",
      "node:update",
      "node:delete",
      "edge:add",
      "edge:update",
      "edge:delete",
      "graph:clear",
    ];

    events.forEach((event) => {
      this.graph.on(event, (...args) => {
        this.emit(event, ...args);
      });
    });
  }

  // Event emitter pattern
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, ...args) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((callback) => {
      callback(...args);
    });
  }

  // Convenience methods
  async initialize() {
    await this.graph.load();
    this.emit("initialized");
  }

  async createNode(type, data) {
    const node = await this.graph.createNode(type, data);
    return node;
  }

  async search(query, limit = 10) {
    return await this.graph.searchNodes(query, limit);
  }

  getNodes(type) {
    return this.graph.getNodes(type);
  }

  getStats() {
    return this.graph.getStats();
  }
}

export { GraphManager };
```

### Vanilla JS App Example

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TurtleDB Vanilla Demo</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .search-bar {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }
      .search-input {
        flex: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      .node-card {
        padding: 15px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      .category {
        background: #007acc;
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 0.8em;
      }
      .create-form {
        margin-top: 30px;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 5px;
      }
      .create-form input, .create-form textarea, .create-form select {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
      }
      .stats {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
        padding: 10px;
        background: #f5f5f5;
        border-radius: 5px;
      }
    </style>
  </head>
  <body>
    <h1>TurtleDB Vanilla Demo</h1>

    <div id="stats" class="stats"></div>

    <div class="search-bar">
      <input
        type="text"
        id="searchInput"
        placeholder="Search articles by meaning..."
        class="search-input"
      >
      <button onclick="search()">Search</button>
      <button onclick="clearSearch()">Clear</button>
    </div>

    <div id="results">
      <h2 id="resultsTitle">All Articles</h2>
      <div id="nodeList"></div>
    </div>

    <div class="create-form">
      <h3>Create New Article</h3>
      <input type="text" id="titleInput" placeholder="Article title" required>
      <textarea
        id="contentInput"
        placeholder="Article content"
        required
      ></textarea>
      <select id="categorySelect">
        <option value="technology">Technology</option>
        <option value="science">Science</option>
        <option value="business">Business</option>
      </select>
      <button onclick="createArticle()">Create Article</button>
    </div>

    <script type="module" src="app.js"></script>
  </body>
</html>
```

```javascript
// app.js
import { GraphManager } from "./graph-manager.js";

const schema = {
  node_types: {
    article: {
      name: "article",
      description: "A blog article",
      data: {
        title: { type: "string", required: true },
        content: { type: "string", required: true },
        category: { type: "string", required: true },
      },
    },
  },
  edge_types: {},
};

// Initialize graph manager
const graphManager = new GraphManager(schema);
let currentResults = [];

// DOM elements
const searchInput = document.getElementById("searchInput");
const nodeList = document.getElementById("nodeList");
const resultsTitle = document.getElementById("resultsTitle");
const statsDiv = document.getElementById("stats");

// Event listeners
graphManager.on("node:add", updateDisplay);
graphManager.on("node:update", updateDisplay);
graphManager.on("node:delete", updateDisplay);
graphManager.on("initialized", updateDisplay);

// Initialize
graphManager.initialize();

// Search functionality
window.search = async function () {
  const query = searchInput.value.trim();
  if (!query) {
    clearSearch();
    return;
  }

  try {
    const results = await graphManager.search(query);
    currentResults = results.map((r) => r.node);
    resultsTitle.textContent = `Search Results for "${query}"`;
    renderNodes(currentResults);
  } catch (error) {
    console.error("Search failed:", error);
  }
};

window.clearSearch = function () {
  searchInput.value = "";
  currentResults = [];
  updateDisplay();
};

// Create article functionality
window.createArticle = async function () {
  const title = document.getElementById("titleInput").value;
  const content = document.getElementById("contentInput").value;
  const category = document.getElementById("categorySelect").value;

  if (!title || !content) {
    alert("Please fill in all required fields");
    return;
  }

  try {
    await graphManager.createNode("article", { title, content, category });

    // Clear form
    document.getElementById("titleInput").value = "";
    document.getElementById("contentInput").value = "";
    document.getElementById("categorySelect").value = "technology";
  } catch (error) {
    console.error("Failed to create article:", error);
    alert("Failed to create article");
  }
};

// Display functions
function updateDisplay() {
  if (currentResults.length > 0) {
    renderNodes(currentResults);
  } else {
    const allNodes = graphManager.getNodes();
    resultsTitle.textContent = `All Articles (${allNodes.length})`;
    renderNodes(allNodes);
  }

  updateStats();
}

function renderNodes(nodes) {
  nodeList.innerHTML = nodes.map((node) => `
    <div class="node-card">
      <h3>${escapeHtml(node.data.title)}</h3>
      <p>${escapeHtml(node.data.content.substring(0, 200))}...</p>
      <span class="category">${escapeHtml(node.data.category)}</span>
    </div>
  `).join("");
}

function updateStats() {
  const stats = graphManager.getStats();
  statsDiv.innerHTML = `
    <span>Nodes: ${stats.nodes}</span>
    <span>Edges: ${stats.edges}</span>
    <span>Types: ${stats.nodeTypes}</span>
  `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Search on Enter key
searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    search();
  }
});
```

## 🔧 Advanced Patterns

### Real-time Collaboration

```javascript
// Real-time sync across multiple clients
class CollaborativeGraph {
  constructor(schema, websocketUrl) {
    this.graph = new GraphCore(schema);
    this.ws = new WebSocket(websocketUrl);
    this.setupSync();
  }

  setupSync() {
    // Send local changes to server
    this.graph.on("node:add", (node) => {
      this.broadcast("node:add", node);
    });

    this.graph.on("node:update", (data) => {
      this.broadcast("node:update", data);
    });

    // Receive remote changes
    this.ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      this.handleRemoteChange(type, data);
    };
  }

  broadcast(type, data) {
    this.ws.send(JSON.stringify({ type, data }));
  }

  handleRemoteChange(type, data) {
    // Apply remote changes without triggering events
    switch (type) {
      case "node:add":
        this.graph.addNodeSilently(data);
        break;
      case "node:update":
        this.graph.updateNodeSilently(data.nodeId, data.changes);
        break;
    }
  }
}
```

### Offline-First with Sync

```javascript
// Offline-first pattern with background sync
class OfflineGraph {
  constructor(schema) {
    this.graph = new GraphCore(schema);
    this.pendingChanges = [];
    this.isOnline = navigator.onLine;
    this.setupOfflineHandling();
  }

  setupOfflineHandling() {
    // Track online/offline status
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });

    // Queue changes when offline
    this.graph.on("node:add", (node) => {
      if (!this.isOnline) {
        this.pendingChanges.push({ type: "add", data: node });
      }
    });
  }

  async syncPendingChanges() {
    for (const change of this.pendingChanges) {
      try {
        await this.syncToServer(change);
      } catch (error) {
        console.error("Sync failed:", error);
        break; // Stop syncing on first failure
      }
    }
    this.pendingChanges = [];
  }

  async syncToServer(change) {
    // Implement your server sync logic
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });

    if (!response.ok) {
      throw new Error("Sync failed");
    }
  }
}
```

### Performance Monitoring

```javascript
// Performance monitoring wrapper
class MonitoredGraph {
  constructor(schema, options = {}) {
    this.graph = new GraphCore(schema, options);
    this.metrics = {
      searchTimes: [],
      createTimes: [],
      loadTime: 0,
    };
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor search performance
    const originalSearch = this.graph.searchNodes.bind(this.graph);
    this.graph.searchNodes = async (...args) => {
      const start = performance.now();
      const result = await originalSearch(...args);
      const duration = performance.now() - start;

      this.metrics.searchTimes.push(duration);
      this.logPerformance("search", duration);

      return result;
    };

    // Monitor node creation
    const originalCreate = this.graph.createNode.bind(this.graph);
    this.graph.createNode = async (...args) => {
      const start = performance.now();
      const result = await originalCreate(...args);
      const duration = performance.now() - start;

      this.metrics.createTimes.push(duration);
      this.logPerformance("create", duration);

      return result;
    };
  }

  logPerformance(operation, duration) {
    if (duration > 100) { // Log slow operations
      console.warn(`Slow ${operation}: ${duration.toFixed(2)}ms`);
    }
  }

  getPerformanceReport() {
    const avgSearch = this.metrics.searchTimes.length > 0
      ? this.metrics.searchTimes.reduce((a, b) => a + b) /
        this.metrics.searchTimes.length
      : 0;

    const avgCreate = this.metrics.createTimes.length > 0
      ? this.metrics.createTimes.reduce((a, b) => a + b) /
        this.metrics.createTimes.length
      : 0;

    return {
      averageSearchTime: avgSearch.toFixed(2) + "ms",
      averageCreateTime: avgCreate.toFixed(2) + "ms",
      totalSearches: this.metrics.searchTimes.length,
      totalCreates: this.metrics.createTimes.length,
    };
  }
}
```

## 🚀 Next Steps

Now that you know how to integrate TurtleDB with your favorite framework:

1. **[API Reference](./api.md)** - Explore all available methods
2. **[Schema Design Guide](./schema-guide.md)** - Design better schemas
3. **[Embeddings Guide](./embeddings.md)** - Master semantic search

## 💡 Best Practices

- **Use framework-specific patterns** - Hooks for React, composables for Vue,
  stores for Svelte
- **Implement proper cleanup** - Remove event listeners when components unmount
- **Cache search results** - Avoid redundant searches for better performance
- **Handle loading states** - Provide feedback during async operations
- **Error boundaries** - Gracefully handle embedding and validation errors
- **Batch operations** - Group multiple changes for better performance

Ready to build reactive, semantic-powered applications? Choose your framework
and start building! 🎯✨
