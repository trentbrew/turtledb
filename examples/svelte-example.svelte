<script>
  import { writable, derived, readable } from 'svelte/store'
  import { createTurtleDBStores } from 'turtledb'
  import { onDestroy } from 'svelte'

  // Create TurtleDB stores with Svelte
  const {
    createGraphStore,
    createSearchStore,
    createNodeStores,
    createEdgeStores,
    createAnalyticsStore,
    createEventStore
  } = createTurtleDBStores({ writable, derived, readable })

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

  // Create stores
  const graphStore = createGraphStore({
    instanceId: 'example',
    schema,
    autoLoad: true
  })

  const searchStore = createSearchStore({
    instanceId: 'example'
  })

  const nodeStores = createNodeStores({
    instanceId: 'example'
  })

  const edgeStores = createEdgeStores({
    instanceId: 'example'
  })

  const analyticsStore = createAnalyticsStore({
    instanceId: 'example'
  })

  const eventStore = createEventStore({
    instanceId: 'example',
    maxEvents: 50
  })

  // Reactive variables for forms
  let newNode = {
    type: 'person',
    name: '',
    email: '',
    role: 'student'
  }

  let newEdge = {
    type: 'authored',
    sourceId: '',
    targetId: '',
    publishedAt: ''
  }

  let searchQuery = ''

  // Derived stores for filtered data
  $: people = $graphStore.nodes.filter(n => n.type === 'person')
  $: articles = $graphStore.nodes.filter(n => n.type === 'article')

  // Event handlers
  const handleCreateNode = async () => {
    try {
      const { type, ...data } = newNode
      await graphStore.createNode(type, data)
      newNode = { type: 'person', name: '', email: '', role: 'student' }
    } catch (err) {
      console.error('Failed to create node:', err)
    }
  }

  const handleDeleteNode = async (id) => {
    if (confirm('Are you sure you want to delete this node?')) {
      try {
        graphStore.deleteNode(id)
      } catch (err) {
        console.error('Failed to delete node:', err)
      }
    }
  }

  const handleCreateEdge = async () => {
    try {
      const { type, sourceId, targetId, ...data } = newEdge
      graphStore.createEdge(type, sourceId, targetId, data)
      newEdge = { type: 'authored', sourceId: '', targetId: '', publishedAt: '' }
    } catch (err) {
      console.error('Failed to create edge:', err)
    }
  }

  const handleDeleteEdge = (id) => {
    if (confirm('Are you sure you want to delete this relationship?')) {
      try {
        graphStore.deleteEdge(id)
      } catch (err) {
        console.error('Failed to delete edge:', err)
      }
    }
  }

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      await searchStore.search(searchQuery, 10)
    }
  }

  const getNodeName = (nodeId) => {
    const node = $graphStore.nodes.find(n => n.id === nodeId)
    return node?.data.name || node?.data.title || 'Unknown'
  }

  // Cleanup on destroy
  onDestroy(() => {
    graphStore.destroy()
    searchStore.destroy()
    nodeStores.destroy()
    edgeStores.destroy()
    analyticsStore.destroy()
    eventStore.destroy()
  })
</script>

<div class="app">
  <h1>🐢 TurtleDB Svelte Example</h1>

  <div class="layout">
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Graph Statistics -->
      <div class="stats-panel">
        <h3>📊 Graph Statistics</h3>
        <div class="stat-grid">
          <div class="stat">
            <label>Total Nodes:</label>
            <span>{$graphStore.stats.totalNodes || 0}</span>
          </div>
          <div class="stat">
            <label>Total Edges:</label>
            <span>{$graphStore.stats.totalEdges || 0}</span>
          </div>
        </div>

        <h4>Nodes by Type</h4>
        <ul>
          {#each Object.entries($graphStore.nodesByType) as [type, count]}
            <li>{type}: {count}</li>
          {/each}
        </ul>

        <h4>Edges by Type</h4>
        <ul>
          {#each Object.entries($graphStore.edgesByType) as [type, count]}
            <li>{type}: {count}</li>
          {/each}
        </ul>
      </div>

      <!-- Search Panel -->
      <div class="search-panel">
        <h3>🔍 Semantic Search</h3>
        <form on:submit|preventDefault={handleSearch}>
          <input
            bind:value={searchQuery}
            type="text"
            placeholder="Search by meaning..."
            disabled={$searchStore.isSearching}
          />
          <button type="submit" disabled={$searchStore.isSearching}>
            {$searchStore.isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {#if $searchStore.searchError}
          <div class="error">
            Error: {$searchStore.searchError.message}
          </div>
        {/if}

        {#if $searchStore.results.length > 0}
          <div class="search-results">
            <h4>Results ({$searchStore.results.length})</h4>
            <button on:click={searchStore.clearResults}>Clear</button>
            <ul>
              {#each $searchStore.results as result}
                <li class="search-result">
                  <strong>{result.node.data.name || result.node.data.title}</strong>
                  <span class="similarity">
                    {(result.similarity * 100).toFixed(1)}% match
                  </span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <!-- Real-time Events -->
      <div class="events-panel">
        <h3>⚡ Recent Events</h3>
        <button on:click={eventStore.clearEvents}>Clear Events</button>
        <div class="events-list">
          {#each $eventStore.events.slice(0, 5) as event}
            <div class="event-item">
              <span class="event-type">{event.type}</span>
              <span class="event-time">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main">
      <!-- Node Manager -->
      <div class="node-manager">
        <h3>👥 Node Management</h3>

        {#if $graphStore.error}
          <div class="error">
            Error: {$graphStore.error.message}
          </div>
        {/if}

        <!-- Create Node Form -->
        <form on:submit|preventDefault={handleCreateNode} class="create-form">
          <h4>Create New Node</h4>
          <select bind:value={newNode.type}>
            <option value="person">Person</option>
            <option value="article">Article</option>
          </select>

          {#if newNode.type === 'person'}
            <input
              bind:value={newNode.name}
              type="text"
              placeholder="Name"
              required
            />
            <input
              bind:value={newNode.email}
              type="email"
              placeholder="Email"
            />
            <select bind:value={newNode.role}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          {:else}
            <input
              bind:value={newNode.title}
              type="text"
              placeholder="Title"
              required
            />
            <textarea
              bind:value={newNode.content}
              placeholder="Content"
              required
            ></textarea>
          {/if}

          <button type="submit" disabled={$graphStore.isLoading}>
            {$graphStore.isLoading ? 'Creating...' : 'Create Node'}
          </button>
        </form>

        <!-- Node List -->
        <div class="node-list">
          <h4>Existing Nodes ({$graphStore.nodes.length})</h4>
          {#each $graphStore.nodes as node}
            <div class="node-item">
              <div class="node-header">
                <span class="node-type">{node.type}</span>
                <button on:click={() => handleDeleteNode(node.id)} class="delete-btn">
                  Delete
                </button>
              </div>
              <div class="node-data">
                <strong>{node.data.name || node.data.title}</strong>
                {#if node.data.email}
                  <div>Email: {node.data.email}</div>
                {/if}
                {#if node.data.role}
                  <div>Role: {node.data.role}</div>
                {/if}
                {#if node.data.content}
                  <div>Content: {node.data.content.substring(0, 100)}...</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Edge Manager -->
      <div class="edge-manager">
        <h3>🔗 Relationship Management</h3>

        <!-- Create Edge Form -->
        <form on:submit|preventDefault={handleCreateEdge} class="create-form">
          <h4>Create New Relationship</h4>
          <select bind:value={newEdge.type}>
            <option value="authored">Authored</option>
            <option value="follows">Follows</option>
          </select>

          <select bind:value={newEdge.sourceId} required>
            <option value="">Select source...</option>
            {#each people as person}
              <option value={person.id}>{person.data.name}</option>
            {/each}
          </select>

          <select bind:value={newEdge.targetId} required>
            <option value="">Select target...</option>
            {#if newEdge.type === 'authored'}
              {#each articles as article}
                <option value={article.id}>{article.data.title}</option>
              {/each}
            {:else}
              {#each people as person}
                <option value={person.id}>{person.data.name}</option>
              {/each}
            {/if}
          </select>

          {#if newEdge.type === 'authored'}
            <input
              bind:value={newEdge.publishedAt}
              type="date"
            />
          {/if}

          <button type="submit">Create Relationship</button>
        </form>

        <!-- Edge List -->
        <div class="edge-list">
          <h4>Existing Relationships ({$graphStore.edges.length})</h4>
          {#each $graphStore.edges as edge}
            <div class="edge-item">
              <div class="edge-header">
                <span class="edge-type">{edge.type}</span>
                <button on:click={() => handleDeleteEdge(edge.id)} class="delete-btn">
                  Delete
                </button>
              </div>
              <div class="edge-data">
                <strong>
                  {getNodeName(edge.sourceNodeId)} →
                  {getNodeName(edge.targetNodeId)}
                </strong>
                {#if edge.data.publishedAt}
                  <div>Published: {edge.data.publishedAt}</div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>

      <!-- Analytics Panel -->
      <div class="analytics-panel">
        <h3>📈 Advanced Analytics</h3>
        {#if $analyticsStore.analytics}
          <div class="analytics-grid">
            <div class="metric">
              <label>Graph Density:</label>
              <span>{($analyticsStore.analytics.density * 100).toFixed(2)}%</span>
            </div>
            <div class="metric">
              <label>Avg Connectivity:</label>
              <span>{$analyticsStore.analytics.avgConnectivity.toFixed(1)}</span>
            </div>
          </div>

          {#if Object.keys($analyticsStore.analytics.hubNodes).length > 0}
            <h4>Hub Nodes (Highly Connected)</h4>
            <ul>
              {#each Object.entries($analyticsStore.analytics.hubNodes) as [nodeId, connections]}
                <li>{getNodeName(nodeId)}: {connections} connections</li>
              {/each}
            </ul>
          {/if}
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
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

  .stats-panel, .search-panel, .events-panel, .node-manager, .edge-manager, .analytics-panel {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid #e9ecef;
  }

  .stat-grid, .analytics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
  }

  .stat, .metric {
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

  .events-list {
    max-height: 200px;
    overflow-y: auto;
  }

  .event-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 8px;
    background: white;
    border-radius: 4px;
    margin-bottom: 2px;
    font-size: 12px;
  }

  .event-type {
    background: #28a745;
    color: white;
    padding: 1px 6px;
    border-radius: 8px;
    font-size: 10px;
  }

  .event-time {
    color: #6c757d;
    font-size: 10px;
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

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 4px 0;
  }

  h3, h4 {
    margin-top: 0;
    margin-bottom: 12px;
  }
</style>
