<script lang="ts">
  export let schema: any;
  export let nodeType: string;
  export let nodes: any[] = [];

  $: fields = schema?.node_types?.[nodeType]?.data ? Object.keys(schema.node_types[nodeType].data) : [];
  $: filteredNodes = nodes.filter(n => n.type === nodeType);
</script>

{#if fields.length && filteredNodes.length}
  <div class="overflow-x-auto mt-8">
    <table class="min-w-full border border-gray-200 rounded-lg shadow bg-white">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-2 font-bold text-left border-b">ID</th>
          {#each fields as field}
            <th class="px-4 py-2 font-bold text-left border-b">{field}</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each filteredNodes as node, i}
          <tr class={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50'}>
            <td class="px-4 py-2 border-b">{node.id}</td>
            {#each fields as field}
              <td class="px-4 py-2 border-b">{node.data[field]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else if fields.length}
  <p class="text-gray-500 mt-8">No {nodeType} nodes to display.</p>
{:else}
  <p class="text-gray-500 mt-8">Select a node type to view.</p>
{/if}
