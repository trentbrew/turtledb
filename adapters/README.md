# TurtleDB Framework Adapters

TurtleDB provides reactive adapters for popular JavaScript frameworks, making it
easy to integrate semantic graph databases into your applications with
framework-specific patterns and best practices.

## 🚀 Quick Start

### React Adapter

```jsx
import React from "react";
import { createTurtleDBHooks } from "turtledb/adapters/react";

// Create hooks with React
const { useGraph, useSearch, useNodes } = createTurtleDBHooks(React);

function MyComponent() {
  const { nodes, createNode, isLoading } = useGraph({
    schema: mySchema,
    autoLoad: true,
  });

  const { search, results } = useSearch();

  return (
    <div>
      <p>Nodes: {nodes.length}</p>
      {/* Your UI here */}
    </div>
  );
}
```

### Vue 3 Adapter

```vue
<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { createTurtleDBComposables } from 'turtledb/adapters/vue'

// Create composables with Vue
const { useGraph, useSearch } = createTurtleDBComposables({
  ref, computed, onUnmounted
})

const { nodes, createNode, isLoading } = useGraph({
  schema: mySchema,
  autoLoad: true
})

const { search, results } = useSearch()
</script>

<template>
  <div>
    <p>Nodes: {{ nodes.length }}</p>
    <!-- Your UI here -->
  </div>
</template>
```

### Svelte Adapter

```svelte
<script>
import { writable, derived, readable } from 'svelte/store'
import { createTurtleDBStores } from 'turtledb/adapters/svelte'

// Create stores with Svelte
const { createGraphStore, createSearchStore } = createTurtleDBStores({
  writable, derived, readable
})

const graphStore = createGraphStore({
  schema: mySchema,
  autoLoad: true
})

const searchStore = createSearchStore()
</script>

<div>
  <p>Nodes: {$graphStore.nodes.length}</p>
  <!-- Your UI here -->
</div>
```

## 📚 Detailed Documentation

### React Adapter

The React adapter provides hooks that integrate seamlessly with React's
component lifecycle and state management.

#### Available Hooks

- **`useGraph(options)`** - Main hook for graph operations
- **`useSearch(options)`** - Semantic search functionality
- **`useNodes(options)`** - Node filtering and querying
- **`useEdges(options)`** - Edge filtering and querying
- **`useGraphStats(options)`** - Graph analytics and statistics

#### useGraph Hook

```jsx
const {
  // State
  nodes, // Array of all nodes
  edges, // Array of all edges
  softLinks, // Array of discovered soft links
  isLoading, // Boolean loading state
  error, // Error object if any
  stats, // Graph statistics
  schema, // Current schema

  // CRUD operations
  createNode, // async (type, data) => node
  updateNode, // (id, update) => void
  deleteNode, // (id) => void
  createEdge, // (type, sourceId, targetId, data) => edge
  updateEdge, // (id, update) => void
  deleteEdge, // (id) => void
  clearGraph, // () => void

  // Persistence
  saveGraph, // async () => void
  loadGraph, // async () => void

  // Advanced features
  generateSoftLinks, // async () => void

  // Direct access
  graph, // GraphCore instance
} = useGraph({
  instanceId: "default", // Unique graph instance ID
  schema: mySchema, // Graph schema
  graphOptions: {}, // Options for GraphCore
  autoLoad: true, // Auto-load persisted data
});
```

#### useSearch Hook

```jsx
const {
  search, // async (query, limit) => results
  results, // Array of search results
  isSearching, // Boolean search state
  searchError, // Search error if any
  clearResults, // () => void
} = useSearch({
  instanceId: "default", // Graph instance to search
  debounce: true, // Debounce search queries
  debounceMs: 300, // Debounce delay
});
```

#### Example: Complete React Component

```jsx
import React, { useState } from "react";
import { createTurtleDBHooks } from "turtledb/adapters/react";

const { useGraph, useSearch } = createTurtleDBHooks(React);

const schema = {
  node_types: {
    person: {
      name: "person",
      data: {
        name: { type: "string", required: true },
        email: { type: "string", required: false },
      },
    },
  },
  edge_types: {
    knows: {
      name: "knows",
      source: { node_type: "person", multiple: true },
      target: { node_type: "person", multiple: true },
    },
  },
};

function PersonManager() {
  const {
    nodes,
    createNode,
    deleteNode,
    isLoading,
    error,
  } = useGraph({ schema });

  const { search, results, isSearching } = useSearch();

  const [newPerson, setNewPerson] = useState({ name: "", email: "" });
  const [searchQuery, setSearchQuery] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createNode("person", newPerson);
      setNewPerson({ name: "", email: "" });
    } catch (err) {
      console.error("Failed to create person:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await search(searchQuery);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>People ({nodes.length})</h2>

      {/* Create Form */}
      <form onSubmit={handleCreate}>
        <input
          value={newPerson.name}
          onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })}
          placeholder="Name"
          required
        />
        <input
          value={newPerson.email}
          onChange={(e) =>
            setNewPerson({ ...newPerson, email: e.target.value })}
          placeholder="Email"
          type="email"
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Person"}
        </button>
      </form>

      {/* Search */}
      <form onSubmit={handleSearch}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people..."
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Search Results */}
      {results.length > 0 && (
        <div>
          <h3>Search Results</h3>
          {results.map((result) => (
            <div key={result.node.id}>
              {result.node.data.name} -{" "}
              {(result.similarity * 100).toFixed(1)}% match
            </div>
          ))}
        </div>
      )}

      {/* People List */}
      <div>
        {nodes.map((person) => (
          <div key={person.id}>
            <strong>{person.data.name}</strong>
            {person.data.email && <span>- {person.data.email}</span>}
            <button onClick={() => deleteNode(person.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Vue 3 Adapter

The Vue adapter provides composables that work with Vue 3's Composition API.

#### Available Composables

- **`useGraph(options)`** - Main composable for graph operations
- **`useSearch(options)`** - Semantic search functionality
- **`useNodes(options)`** - Node filtering and querying
- **`useEdges(options)`** - Edge filtering and querying
- **`useGraphStats(options)`** - Graph analytics
- **`useGraphStore(options)`** - Pinia-like store interface

#### Example: Vue Component

```vue
<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { createTurtleDBComposables } from 'turtledb/adapters/vue'

const { useGraph, useSearch } = createTurtleDBComposables({
  ref, computed, onUnmounted
})

const schema = {
  node_types: {
    task: {
      name: "task",
      data: {
        title: { type: "string", required: true },
        completed: { type: "boolean", required: false }
      }
    }
  }
}

const {
  nodes,
  createNode,
  updateNode,
  deleteNode,
  isLoading
} = useGraph({ schema })

const { search, results, isSearching } = useSearch()

const newTask = ref({ title: '', completed: false })
const searchQuery = ref('')

const completedTasks = computed(() =>
  nodes.value.filter(task => task.data.completed)
)

const pendingTasks = computed(() =>
  nodes.value.filter(task => !task.data.completed)
)

const handleCreateTask = async () => {
  try {
    await createNode('task', newTask.value)
    newTask.value = { title: '', completed: false }
  } catch (err) {
    console.error('Failed to create task:', err)
  }
}

const toggleTask = (task) => {
  updateNode(task.id, {
    data: { completed: !task.data.completed }
  })
}

const handleSearch = async () => {
  if (searchQuery.value.trim()) {
    await search(searchQuery.value)
  }
}
</script>

<template>
  <div>
    <h2>Task Manager</h2>

    <!-- Create Task -->
    <form @submit.prevent="handleCreateTask">
      <input
        v-model="newTask.title"
        placeholder="Task title"
        required
      />
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Creating...' : 'Add Task' }}
      </button>
    </form>

    <!-- Search -->
    <div>
      <input
        v-model="searchQuery"
        placeholder="Search tasks..."
        @keyup.enter="handleSearch"
      />
      <button @click="handleSearch" :disabled="isSearching">
        {{ isSearching ? 'Searching...' : 'Search' }}
      </button>
    </div>

    <!-- Search Results -->
    <div v-if="results.length > 0">
      <h3>Search Results</h3>
      <div v-for="result in results" :key="result.node.id">
        {{ result.node.data.title }} - {{ (result.similarity * 100).toFixed(1) }}% match
      </div>
    </div>

    <!-- Task Lists -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h3>Pending Tasks ({{ pendingTasks.length }})</h3>
        <div v-for="task in pendingTasks" :key="task.id">
          <label>
            <input
              type="checkbox"
              :checked="task.data.completed"
              @change="toggleTask(task)"
            />
            {{ task.data.title }}
          </label>
          <button @click="deleteNode(task.id)">Delete</button>
        </div>
      </div>

      <div>
        <h3>Completed Tasks ({{ completedTasks.length }})</h3>
        <div v-for="task in completedTasks" :key="task.id">
          <label>
            <input
              type="checkbox"
              :checked="task.data.completed"
              @change="toggleTask(task)"
            />
            <s>{{ task.data.title }}</s>
          </label>
          <button @click="deleteNode(task.id)">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>
```

### Svelte Adapter

The Svelte adapter provides store creators that work with Svelte's reactive
store system.

#### Available Store Creators

- **`createGraphStore(options)`** - Main graph store
- **`createSearchStore(options)`** - Search functionality store
- **`createNodeStores(options)`** - Node filtering stores
- **`createEdgeStores(options)`** - Edge filtering stores
- **`createAnalyticsStore(options)`** - Advanced analytics store
- **`createEventStore(options)`** - Real-time event tracking

#### Example: Svelte Component

```svelte
<script>
import { writable, derived, readable } from 'svelte/store'
import { createTurtleDBStores } from 'turtledb/adapters/svelte'
import { onDestroy } from 'svelte'

const { createGraphStore, createSearchStore, createAnalyticsStore } = createTurtleDBStores({
  writable, derived, readable
})

const schema = {
  node_types: {
    note: {
      name: "note",
      data: {
        title: { type: "string", required: true },
        content: { type: "string", required: true },
        tags: { type: "array", required: false }
      }
    }
  }
}

const graphStore = createGraphStore({ schema })
const searchStore = createSearchStore()
const analyticsStore = createAnalyticsStore()

let newNote = { title: '', content: '', tags: [] }
let searchQuery = ''

const handleCreateNote = async () => {
  try {
    await graphStore.createNode('note', newNote)
    newNote = { title: '', content: '', tags: [] }
  } catch (err) {
    console.error('Failed to create note:', err)
  }
}

const handleSearch = async () => {
  if (searchQuery.trim()) {
    await searchStore.search(searchQuery)
  }
}

onDestroy(() => {
  graphStore.destroy()
  searchStore.destroy()
  analyticsStore.destroy()
})
</script>

<div>
  <h2>Note Taking App</h2>

  <!-- Create Note -->
  <form on:submit|preventDefault={handleCreateNote}>
    <input
      bind:value={newNote.title}
      placeholder="Note title"
      required
    />
    <textarea
      bind:value={newNote.content}
      placeholder="Note content"
      required
    ></textarea>
    <button type="submit" disabled={$graphStore.isLoading}>
      {$graphStore.isLoading ? 'Creating...' : 'Create Note'}
    </button>
  </form>

  <!-- Search -->
  <div>
    <input
      bind:value={searchQuery}
      placeholder="Search notes..."
    />
    <button on:click={handleSearch} disabled={$searchStore.isSearching}>
      {$searchStore.isSearching ? 'Searching...' : 'Search'}
    </button>
  </div>

  <!-- Search Results -->
  {#if $searchStore.results.length > 0}
    <div>
      <h3>Search Results</h3>
      {#each $searchStore.results as result}
        <div>
          <strong>{result.node.data.title}</strong>
          <p>{result.node.data.content.substring(0, 100)}...</p>
          <small>{(result.similarity * 100).toFixed(1)}% match</small>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Analytics -->
  {#if $analyticsStore.analytics}
    <div>
      <h3>Analytics</h3>
      <p>Total Notes: {$analyticsStore.analytics.totalNodes}</p>
      <p>Average Connectivity: {$analyticsStore.analytics.avgConnectivity.toFixed(1)}</p>
    </div>
  {/if}

  <!-- Notes List -->
  <div>
    <h3>All Notes ({$graphStore.nodes.length})</h3>
    {#each $graphStore.nodes as note}
      <div>
        <h4>{note.data.title}</h4>
        <p>{note.data.content}</p>
        <button on:click={() => graphStore.deleteNode(note.id)}>
          Delete
        </button>
      </div>
    {/each}
  </div>
</div>

<style>
  textarea {
    width: 100%;
    min-height: 100px;
    margin: 10px 0;
  }

  input, button {
    margin: 5px;
    padding: 8px;
  }
</style>
```

## 🔧 Advanced Features

### Multiple Graph Instances

All adapters support multiple graph instances using the `instanceId` option:

```javascript
// React
const userGraph = useGraph({ instanceId: "users", schema: userSchema });
const postGraph = useGraph({ instanceId: "posts", schema: postSchema });

// Vue
const userGraph = useGraph({ instanceId: "users", schema: userSchema });
const postGraph = useGraph({ instanceId: "posts", schema: postSchema });

// Svelte
const userStore = createGraphStore({ instanceId: "users", schema: userSchema });
const postStore = createGraphStore({ instanceId: "posts", schema: postSchema });
```

### Error Handling

All adapters provide comprehensive error handling:

```javascript
// React
const { error, isLoading } = useGraph({ schema })

if (error) {
  return <div>Error: {error.message}</div>
}

// Vue
const { error, isLoading } = useGraph({ schema })

// Svelte
{#if $graphStore.error}
  <div>Error: {$graphStore.error.message}</div>
{/if}
```

### Performance Optimization

- **Debounced Search**: Search queries are automatically debounced to prevent
  excessive API calls
- **Selective Loading**: Use `autoLoad: false` to prevent automatic data loading
- **Instance Sharing**: Multiple components can share the same graph instance
- **Cleanup**: All adapters provide proper cleanup to prevent memory leaks

### TypeScript Support

All adapters are written in JavaScript but provide excellent TypeScript support
through JSDoc comments and can be easily typed:

```typescript
// React with TypeScript
interface MyNode {
  id: string;
  type: string;
  data: {
    name: string;
    email?: string;
  };
}

const { nodes } = useGraph<MyNode>({ schema });
```

## 🎯 Best Practices

1. **Schema Definition**: Always define a comprehensive schema for type safety
   and validation
2. **Error Boundaries**: Implement error boundaries in React or error handling
   in Vue/Svelte
3. **Loading States**: Use the provided loading states for better UX
4. **Instance Management**: Use meaningful instance IDs for multiple graphs
5. **Cleanup**: Always clean up resources in component unmount handlers
6. **Debouncing**: Use debounced search for better performance
7. **Batch Operations**: Group multiple operations when possible

## 🚀 Next Steps

- Check out the complete examples in the `/examples` directory
- Read the main TurtleDB documentation for core concepts
- Explore the semantic search capabilities
- Try building a real-time collaborative application
- Consider the upcoming ReactFlow/SvelteFlow visualization adapters

## 🤝 Contributing

We welcome contributions to improve the framework adapters! Please see the main
project's contributing guidelines for more information.
