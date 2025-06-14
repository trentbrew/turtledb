<script context="module" lang="ts">
  export const ssr = false;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { GraphCore } from '$lib/turtledb';
  import { schema } from '$lib/schema';
  import NodeForm from '$lib/NodeForm.svelte';
  import NodeTable from '$lib/NodeTable.svelte';

  let graph = new GraphCore(schema);
  let nodes = graph.getNodes();
  let nodeTypes = Object.keys(schema.node_types);
  let selectedType = nodeTypes[0];

  // Auto-load from IndexedDB on mount
  onMount(async () => {
    await graph.load();
    nodes = graph.getNodes();
  });

  async function handleCreate(event: CustomEvent) {
    const id = Math.random().toString(36).slice(2, 9);
    graph.addNode({ id, type: selectedType, data: event.detail });
    nodes = graph.getNodes();
    await graph.save(); // Auto-save after change
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col items-center py-10">
  <div class="w-full max-w-2xl">
    <h1 class="text-3xl font-bold mb-2 text-center text-blue-700">Welcome to SvelteKit + TurtleDB</h1>
    <p class="text-center text-gray-600 mb-6">Schema-driven node form and table demo.</p>

    <div class="mb-4 flex items-center gap-2">
      <label class="font-medium text-gray-700">Node type:</label>
      <select bind:value={selectedType} class="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400">
        {#each nodeTypes as type}
          <option value={type}>{type}</option>
        {/each}
      </select>
    </div>

    <NodeForm {schema} nodeType={selectedType} on:create={handleCreate} />
    <NodeTable {schema} nodeType={selectedType} {nodes} />
  </div>
</div>
