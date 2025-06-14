import { GraphCore } from '../core/graph.ts';
import { schema } from './schema.example.ts';

// Create a new graph instance with the example schema
const graph = new GraphCore(schema);

console.log('TurtleDB REPL CLI');
console.log('Type ".help" for available commands.');

async function repl() {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  while (true) {
    await Deno.stdout.write(encoder.encode('> '));
    const buf = new Uint8Array(1024);
    const n: number | null = await Deno.stdin.read(buf);
    if (n === null) break;
    const input = decoder.decode(buf.subarray(0, n)).trim();
    if (!input) continue;
    if (input === '.exit') break;
    if (input === '.help') {
      printHelp();
      continue;
    }
    try {
      await handleCommand(input);
    } catch (e: any) {
      console.error('Error:', e.message);
    }
  }
  console.log('Goodbye!');
}

function printHelp() {
  console.log(`\nCommands:
  add node <type> <json>         Add a node (e.g. add node member {"name":"Alice"})
  add edge <type> <src> <tgt> <json>  Add an edge (e.g. add edge knows 1 2 {"since":2020})
  update node <id> <json>        Update a node (e.g. update node 1 {"data":{"age":31}})
  delete node <id>               Delete a node
  delete edge <id>               Delete an edge
  print                          Print all nodes and edges
  clear                          Clear the graph
  .help                          Show this help
  .exit                          Exit the REPL\n`);
}

async function handleCommand(input: string) {
  const [cmd, ...args] = input.split(' ');
  switch (cmd) {
    case 'add':
      if (args[0] === 'node') {
        const [type, ...jsonParts] = args.slice(1);
        const json = jsonParts.join(' ');
        const data = JSON.parse(json);
        const node = graph.createNode(type, data);
        console.log('Node added:', node);
      } else if (args[0] === 'edge') {
        const [type, src, tgt, ...jsonParts] = args.slice(1);
        const json = jsonParts.join(' ');
        const data = JSON.parse(json);
        const edge = graph.createEdge(type, src, tgt, data);
        console.log('Edge added:', edge);
      } else {
        console.log('Unknown add command.');
      }
      break;
    case 'update':
      if (args[0] === 'node') {
        const [id, ...jsonParts] = args.slice(1);
        const json = jsonParts.join(' ');
        const update = JSON.parse(json);
        graph.updateNode(id, update);
        console.log(
          'Node updated:',
          graph.getNodes().find((n) => n.id === id),
        );
      } else if (args[0] === 'edge') {
        const [id, ...jsonParts] = args.slice(1);
        const json = jsonParts.join(' ');
        const update = JSON.parse(json);
        graph.updateEdge(id, update);
        console.log(
          'Edge updated:',
          graph.getEdges().find((e) => e.id === id),
        );
      } else {
        console.log('Unknown update command.');
      }
      break;
    case 'delete':
      if (args[0] === 'node') {
        const id = args[1];
        graph.deleteNode(id);
        console.log('Node deleted:', id);
      } else if (args[0] === 'edge') {
        const id = args[1];
        graph.deleteEdge(id);
        console.log('Edge deleted:', id);
      } else {
        console.log('Unknown delete command.');
      }
      break;
    case 'print':
      console.log('Nodes:', graph.getNodes());
      console.log('Edges:', graph.getEdges());
      break;
    case 'clear':
      graph.clear();
      console.log('Graph cleared.');
      break;
    default:
      console.log('Unknown command. Type .help for help.');
  }
}

if (import.meta.main) {
  repl();
}
