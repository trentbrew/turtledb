<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let schema: any;
  export let nodeType: string;

  const dispatch = createEventDispatcher();
  let formData: Record<string, any> = {};

  $: fields = schema?.node_types?.[nodeType]?.data ? Object.entries(schema.node_types[nodeType].data) : [];

  function handleSubmit(e: Event) {
    e.preventDefault();
    dispatch('create', { ...formData });
    formData = {}; // reset
  }
</script>

{#if fields.length}
  <form on:submit|preventDefault={handleSubmit} class="space-y-4 bg-white p-6 rounded-lg shadow max-w-md border border-gray-200 mt-4">
    {#each fields as [field, type]}
      <div class="flex flex-col gap-1">
        <label class="font-medium text-gray-700">{field} <span class="text-xs text-gray-400">({type})</span></label>
        <input
          class="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          type={type === 'number' ? 'number' : 'text'}
          bind:value={formData[field]}
          required
        />
      </div>
    {/each}
    <button type="submit" class="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Add {nodeType}</button>
  </form>
{:else}
  <p class="text-gray-500 mt-4">Select a node type to add.</p>
{/if}
