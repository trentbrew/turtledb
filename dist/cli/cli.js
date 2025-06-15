import { GraphCore } from "../core/graph.ts";
import { schema } from "../tests/schema.example.ts";
import { getEmbedding } from "../core/embeddings.ts";
import { dirname, fromFileUrl, join, } from "https://deno.land/std@0.197.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.197.0/fs/ensure_dir.ts";
import { Input } from "https://deno.land/x/cliffy@v0.25.7/prompt/input.ts";
// --------- Flag Parsing ---------
const args = Deno.args;
const USE_MOCK_EMBED = args.includes("--mock-embed");
const graphArgIndex = args.indexOf("--graph");
const START_GRAPH_NAME = graphArgIndex !== -1 && args[graphArgIndex + 1]
    ? args[graphArgIndex + 1]
    : "default";
// --------- Helpers & Styling ---------
const mockEmbed = (_v) => Promise.resolve(Array(5).fill(0));
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
};
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let spinIdx = 0;
function showSpinner(msg) {
    const int = setInterval(() => {
        Deno.stdout.writeSync(new TextEncoder().encode(`\r${colors.cyan}${SPINNER[spinIdx % SPINNER.length]}${colors.reset} ${msg}`));
        spinIdx++;
    }, 100);
    return () => {
        clearInterval(int);
        Deno.stdout.writeSync(new TextEncoder().encode("\r"));
    };
}
function colorJSON(v) {
    return JSON.stringify(v, null, 2)
        .replace(/"([^\"]+)":/g, `${colors.blue}"$1"${colors.reset}:`)
        .replace(/: "([^\"]+)"/g, `: ${colors.green}"$1"${colors.reset}`)
        .replace(/: (\d+)/g, `: ${colors.yellow}$1${colors.reset}`)
        .replace(/: (true|false)/g, `: ${colors.magenta}$1${colors.reset}`)
        .replace(/: null/g, `: ${colors.gray}null${colors.reset}`);
}
// --------- Persistence Setup ---------
const PROJECT_ROOT = join(dirname(fromFileUrl(import.meta.url)), "..");
const GRAPHS_DIR = join(PROJECT_ROOT, "graphs");
await ensureDir(GRAPHS_DIR);
async function saveGraph(name, g) {
    const file = join(GRAPHS_DIR, `${name}.json`);
    const data = { schema, nodes: g.getNodes(), edges: g.getEdges() };
    await Deno.writeTextFile(file, JSON.stringify(data, null, 2));
}
async function loadGraph(name, useRealEmbeddings = true) {
    const file = join(GRAPHS_DIR, `${name}.json`);
    try {
        const raw = await Deno.readTextFile(file);
        const data = JSON.parse(raw);
        const g = useRealEmbeddings
            ? new GraphCore(data.schema ?? schema)
            : new GraphCore(data.schema ?? schema, { embeddingFn: mockEmbed });
        for (const n of data.nodes ?? [])
            g.addNode(n);
        for (const e of data.edges ?? [])
            g.addEdge(e);
        return g;
    }
    catch {
        return useRealEmbeddings
            ? new GraphCore(schema)
            : new GraphCore(schema, { embeddingFn: mockEmbed });
    }
}
function listGraphs() {
    return Array.from(Deno.readDirSync(GRAPHS_DIR))
        .filter((e) => e.isFile && e.name.endsWith(".json"))
        .map((e) => e.name.replace(/\.json$/, ""));
}
// --------- Timeout Helper ---------
const TIMEOUT = 10_000;
function withTimeout(p, ms = TIMEOUT) {
    return Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms)),
    ]);
}
async function exec(msg, task) {
    const stop = showSpinner(msg);
    try {
        const res = await withTimeout(task);
        stop();
        return res;
    }
    catch (e) {
        stop();
        console.error(`${colors.red}Error:${colors.reset}`, e.message);
        return null;
    }
}
// --------- Graph Initialization ---------
console.log("⬛️⬛️⬛️⬛️🟩🟩⬛️⬛️⬛️🟩");
console.log("⬛️⬛️⬛️⬛️🟩🟩⬛️⬛️⬛️⬛️");
console.log("⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️");
console.log("⬛️⬛️⬛️🟩🟩🟩🟩⬛️⬛️⬛️");
console.log("🟩🟩⬛️🟩🟩🟩🟩⬛️🟩🟩");
console.log("🟩🟩⬛️🟩🟩🟩🟩⬛️🟩🟩");
console.log("⬛️⬛️⬛️🟩🟩🟩🟩⬛️⬛️⬛️");
console.log("⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️⬛️");
console.log("⬛️⬛️⬛️⬛️🟩🟩⬛️⬛️⬛️⬛️");
console.log("🟩⬛️⬛️⬛️🟩🟩⬛️⬛️⬛️⬛️");
console.log(`${colors.cyan}Initializing TurtleDB...${colors.reset}`);
let useRealEmbeddings = true;
let graph;
if (USE_MOCK_EMBED) {
    console.log(`${colors.gray}Using mock embeddings (--mock-embed flag)${colors.reset}`);
    graph = new GraphCore(schema, { embeddingFn: mockEmbed });
}
else {
    try {
        console.log(`${colors.gray}Testing real embeddings...${colors.reset}`);
        graph = new GraphCore(schema);
        // Test embeddings with a simple string instead of creating a node
        await getEmbedding("test");
        useRealEmbeddings = true;
        console.log(`${colors.green}✓ Real embeddings available${colors.reset}`);
    }
    catch (e) {
        console.warn(`${colors.yellow}⚠ Falling back to mock embeddings: ${e.message}${colors.reset}`);
        graph = new GraphCore(schema, { embeddingFn: mockEmbed });
    }
}
let currentGraph = START_GRAPH_NAME;
graph = await loadGraph(currentGraph, useRealEmbeddings);
console.log(`\n${colors.green}Loaded graph:${colors.reset} ${currentGraph}`);
// --------- REPL ---------
async function repl() {
    while (true) {
        const lineRaw = await Input.prompt({
            message: "", // no trailing colon
            prefix: `${colors.green}[${currentGraph}]${colors.reset} `,
        });
        const line = lineRaw.trim();
        if (line === "/exit" || line === "/bye")
            break;
        if (line === "/help") {
            help();
            continue;
        }
        try {
            await cmd(line);
        }
        catch (e) {
            console.error(`${colors.red}Error:${colors.reset}`, e.message);
        }
    }
    await saveGraph(currentGraph, graph);
    console.log(`${colors.cyan}Goodbye${colors.reset}`);
}
function help() {
    console.log(`${colors.bright}Commands${colors.reset}`);
    console.log(`  add node <type> <json>     - Example: add node person {"name":"alice"}`);
    console.log(`  add edge <type> <srcId> <tgtId> <json>`);
    console.log(`  list [types]              - List nodes/edges or available types`);
    console.log(`  schema [node|edge] [type] - View detailed schema information`);
    console.log(`  inspect <nodeId>          - View detailed info about a specific node`);
    console.log(`  status                    - Show embedding and system status`);
    console.log(`  graphs | ls               - List available graphs`);
    console.log(`  new <name>                - Create & switch to empty graph`);
    console.log(`  open <name>               - Switch to existing graph`);
    console.log(`  save                      - Save current graph`);
    console.log(`  enrich                    - Run enrichment scan`);
    console.log(`  reload                    - Reload the CLI`);
    console.log(`  /exit | /bye              - Exit the CLI`);
}
async function cmd(line) {
    const [cmd, ...a] = line.split(" ");
    const persist = () => saveGraph(currentGraph, graph);
    switch (cmd) {
        case "add":
            if (a[0] === "node") {
                const [type, ...jsonParts] = a.slice(1);
                if (!type) {
                    console.log("Usage: add node <type> <json>");
                    console.log('Example: add node person {"name":"alice"}');
                    break;
                }
                let data = {};
                if (jsonParts.length > 0) {
                    try {
                        data = JSON.parse(jsonParts.join(" "));
                    }
                    catch (e) {
                        console.log(`${colors.red}Invalid JSON:${colors.reset} ${e.message}`);
                        console.log('Example: add node person {"name":"alice"}');
                        break;
                    }
                }
                const n = await exec(`adding node`, graph.createNode(type, data));
                if (n)
                    console.log(colorJSON(n));
                await persist();
            }
            else if (a[0] === "edge") {
                const [type, src, tgt, ...jsonParts] = a.slice(1);
                if (!type || !src || !tgt) {
                    console.log("add edge <type> <srcId> <tgtId> <json>");
                    break;
                }
                let data = {};
                if (jsonParts.length) {
                    try {
                        data = JSON.parse(jsonParts.join(" "));
                    }
                    catch (e) {
                        console.log(`${colors.red}Invalid JSON:${colors.reset} ${e.message}`);
                        break;
                    }
                }
                const e = await exec("adding edge", Promise.resolve(graph.createEdge(type, src, tgt, data)));
                if (e)
                    console.log(colorJSON(e));
                await persist();
            }
            break;
        case "schema":
            {
                const [category, typeName] = a;
                if (!category) {
                    // Show all schemas overview
                    console.log(`${colors.bright}${colors.blue}Schema Overview${colors.reset}`);
                    console.log(`\n${colors.bright}Node Types:${colors.reset}`);
                    for (const [name, nodeType] of Object.entries(schema.node_types)) {
                        console.log(`  ${colors.green}${name}${colors.reset}: ${nodeType.description || "No description"}`);
                        if (nodeType.synonyms?.length) {
                            console.log(`    ${colors.gray}Synonyms: ${nodeType.synonyms.join(", ")}${colors.reset}`);
                        }
                    }
                    console.log(`\n${colors.bright}Edge Types:${colors.reset}`);
                    for (const [name, edgeType] of Object.entries(schema.edge_types)) {
                        console.log(`  ${colors.green}${name}${colors.reset}: ${edgeType.description || "No description"}`);
                        console.log(`    ${colors.gray}${edgeType.source.node_type} → ${edgeType.target.node_type}${colors.reset}`);
                    }
                }
                else if (category === "node") {
                    if (!typeName) {
                        console.log(`${colors.bright}${colors.blue}Node Types:${colors.reset}`);
                        for (const [name, nodeType] of Object.entries(schema.node_types)) {
                            console.log(`\n${colors.green}${name}${colors.reset}`);
                            console.log(`  Description: ${nodeType.description || "No description"}`);
                            if (nodeType.synonyms?.length) {
                                console.log(`  Synonyms: ${colors.gray}${nodeType.synonyms.join(", ")}${colors.reset}`);
                            }
                            console.log(`  Data Schema:`);
                            console.log(colorJSON(nodeType.data));
                        }
                    }
                    else {
                        const nodeType = schema.node_types[typeName];
                        if (!nodeType) {
                            console.log(`${colors.red}Node type '${typeName}' not found${colors.reset}`);
                            console.log(`Available types: ${Object.keys(schema.node_types).join(", ")}`);
                        }
                        else {
                            console.log(`${colors.bright}${colors.blue}Node Type: ${colors.green}${typeName}${colors.reset}`);
                            console.log(`Description: ${nodeType.description || "No description"}`);
                            if (nodeType.synonyms?.length) {
                                console.log(`Synonyms: ${colors.gray}${nodeType.synonyms.join(", ")}${colors.reset}`);
                            }
                            console.log(`Data Schema:`);
                            console.log(colorJSON(nodeType.data));
                        }
                    }
                }
                else if (category === "edge") {
                    if (!typeName) {
                        console.log(`${colors.bright}${colors.blue}Edge Types:${colors.reset}`);
                        for (const [name, edgeType] of Object.entries(schema.edge_types)) {
                            console.log(`\n${colors.green}${name}${colors.reset}`);
                            console.log(`  Description: ${edgeType.description || "No description"}`);
                            console.log(`  Connection: ${colors.cyan}${edgeType.source.node_type}${colors.reset} → ${colors.cyan}${edgeType.target.node_type}${colors.reset}`);
                            console.log(`  Source: ${edgeType.source.multiple ? "multiple" : "single"}, ${edgeType.source.required ? "required" : "optional"}`);
                            console.log(`  Target: ${edgeType.target.multiple ? "multiple" : "single"}, ${edgeType.target.required ? "required" : "optional"}`);
                            console.log(`  Data Schema:`);
                            console.log(colorJSON(edgeType.data));
                        }
                    }
                    else {
                        const edgeType = schema.edge_types[typeName];
                        if (!edgeType) {
                            console.log(`${colors.red}Edge type '${typeName}' not found${colors.reset}`);
                            console.log(`Available types: ${Object.keys(schema.edge_types).join(", ")}`);
                        }
                        else {
                            console.log(`${colors.bright}${colors.blue}Edge Type: ${colors.green}${typeName}${colors.reset}`);
                            console.log(`Description: ${edgeType.description || "No description"}`);
                            console.log(`Connection: ${colors.cyan}${edgeType.source.node_type}${colors.reset} → ${colors.cyan}${edgeType.target.node_type}${colors.reset}`);
                            console.log(`Source: ${edgeType.source.multiple ? "multiple" : "single"}, ${edgeType.source.required ? "required" : "optional"}`);
                            console.log(`Target: ${edgeType.target.multiple ? "multiple" : "single"}, ${edgeType.target.required ? "required" : "optional"}`);
                            console.log(`Data Schema:`);
                            console.log(colorJSON(edgeType.data));
                        }
                    }
                }
                else {
                    console.log(`${colors.red}Invalid category '${category}'${colors.reset}`);
                    console.log("Usage: schema [node|edge] [type]");
                    console.log("Examples:");
                    console.log("  schema              - Show all schemas overview");
                    console.log("  schema node         - Show all node types");
                    console.log("  schema edge         - Show all edge types");
                    console.log("  schema node member  - Show specific node type");
                    console.log("  schema edge wrote   - Show specific edge type");
                }
            }
            break;
        case "inspect":
            {
                const nodeId = a[0];
                if (!nodeId) {
                    console.log("Usage: inspect <nodeId>");
                    console.log("Example: inspect node_123");
                    break;
                }
                const node = graph.getNodes().find((n) => n.id === nodeId);
                if (!node) {
                    console.log(`${colors.red}Node '${nodeId}' not found${colors.reset}`);
                    console.log("Available nodes:");
                    const nodes = graph.getNodes();
                    if (nodes.length === 0) {
                        console.log(`  ${colors.gray}(no nodes in graph)${colors.reset}`);
                    }
                    else {
                        nodes.forEach((n) => {
                            console.log(`  ${colors.green}${n.id}${colors.reset} (${n.type})`);
                        });
                    }
                    break;
                }
                console.log(`${colors.bright}${colors.blue}Node Details${colors.reset}`);
                console.log(`ID: ${colors.green}${node.id}${colors.reset}`);
                console.log(`Type: ${colors.cyan}${node.type}${colors.reset}`);
                console.log(`Created: ${colors.gray}${node.createdAt}${colors.reset}`);
                console.log(`Updated: ${colors.gray}${node.updatedAt}${colors.reset}`);
                // Show the node's type schema
                const nodeType = schema.node_types[node.type];
                if (nodeType) {
                    console.log(`\n${colors.bright}Type Schema:${colors.reset}`);
                    console.log(`Description: ${nodeType.description || "No description"}`);
                    if (nodeType.synonyms?.length) {
                        console.log(`Synonyms: ${colors.gray}${nodeType.synonyms.join(", ")}${colors.reset}`);
                    }
                    console.log(`Expected Data Schema:`);
                    console.log(colorJSON(nodeType.data));
                }
                console.log(`\n${colors.bright}Actual Data:${colors.reset}`);
                console.log(colorJSON(node.data));
                // Show embedding info if available
                if ("embedding" in node) {
                    const embedding = node.embedding;
                    console.log(`\n${colors.bright}Embedding:${colors.reset}`);
                    console.log(`Dimensions: ${colors.yellow}${embedding.length}${colors.reset}`);
                    console.log(`Sample values: ${colors.gray}[${embedding.slice(0, 5).map((v) => v.toFixed(4)).join(", ")}...]${colors.reset}`);
                }
                else {
                    console.log(`\n${colors.gray}No embedding available${colors.reset}`);
                }
                // Show connected edges
                const connectedEdges = graph.getEdges().filter((e) => e.sourceNodeId === nodeId || e.targetNodeId === nodeId);
                if (connectedEdges.length > 0) {
                    console.log(`\n${colors.bright}Connected Edges (${connectedEdges.length}):${colors.reset}`);
                    connectedEdges.forEach((edge) => {
                        const direction = edge.sourceNodeId === nodeId
                            ? "outgoing"
                            : "incoming";
                        const otherNodeId = edge.sourceNodeId === nodeId
                            ? edge.targetNodeId
                            : edge.sourceNodeId;
                        const otherNode = graph.getNodes().find((n) => n.id === otherNodeId);
                        console.log(`  ${colors.green}${edge.id}${colors.reset} (${edge.type}) - ${direction} to ${colors.cyan}${otherNodeId}${colors.reset}${otherNode ? ` (${otherNode.type})` : ""}`);
                    });
                }
                else {
                    console.log(`\n${colors.gray}No connected edges${colors.reset}`);
                }
                // Show soft links if available
                if (graph.softLinks && graph.softLinks.length > 0) {
                    const relatedSoftLinks = graph.softLinks.filter((link) => link.sourceId === nodeId || link.targetId === nodeId);
                    if (relatedSoftLinks.length > 0) {
                        console.log(`\n${colors.bright}Soft Links (${relatedSoftLinks.length}):${colors.reset}`);
                        relatedSoftLinks.forEach((link) => {
                            const otherNodeId = link.sourceId === nodeId
                                ? link.targetId
                                : link.sourceId;
                            const otherNode = graph.getNodes().find((n) => n.id === otherNodeId);
                            console.log(`  ${colors.magenta}${link.reason}${colors.reset} to ${colors.cyan}${otherNodeId}${colors.reset}${otherNode ? ` (${otherNode.type})` : ""}${link.score ? ` - score: ${link.score.toFixed(3)}` : ""}${link.property ? ` - property: ${link.property}` : ""}`);
                        });
                    }
                }
            }
            break;
        case "status":
            {
                console.log(`${colors.bright}${colors.blue}TurtleDB Status${colors.reset}`);
                console.log(`Current Graph: ${colors.green}${currentGraph}${colors.reset}`);
                console.log(`Embeddings: ${USE_MOCK_EMBED || !useRealEmbeddings
                    ? `${colors.yellow}Mock (zeros)${colors.reset}`
                    : `${colors.green}Real (deterministic hash-based)${colors.reset}`}`);
                const nodes = graph.getNodes();
                const edges = graph.getEdges();
                console.log(`\n${colors.bright}Graph Statistics:${colors.reset}`);
                console.log(`  Nodes: ${colors.yellow}${nodes.length}${colors.reset}`);
                console.log(`  Edges: ${colors.yellow}${edges.length}${colors.reset}`);
                // Count nodes with embeddings
                const nodesWithEmbeddings = nodes.filter((n) => "embedding" in n).length;
                console.log(`  Nodes with embeddings: ${colors.yellow}${nodesWithEmbeddings}${colors.reset}/${nodes.length}`);
                // Show soft links if available
                if (graph.softLinks && graph.softLinks.length > 0) {
                    console.log(`  Soft links: ${colors.yellow}${graph.softLinks.length}${colors.reset}`);
                }
                // Show node type distribution
                if (nodes.length > 0) {
                    console.log(`\n${colors.bright}Node Types:${colors.reset}`);
                    const typeCounts = nodes.reduce((acc, node) => {
                        acc[node.type] = (acc[node.type] || 0) + 1;
                        return acc;
                    }, {});
                    for (const [type, count] of Object.entries(typeCounts)) {
                        console.log(`  ${colors.green}${type}${colors.reset}: ${count}`);
                    }
                }
                // Show edge type distribution
                if (edges.length > 0) {
                    console.log(`\n${colors.bright}Edge Types:${colors.reset}`);
                    const typeCounts = edges.reduce((acc, edge) => {
                        acc[edge.type] = (acc[edge.type] || 0) + 1;
                        return acc;
                    }, {});
                    for (const [type, count] of Object.entries(typeCounts)) {
                        console.log(`  ${colors.green}${type}${colors.reset}: ${count}`);
                    }
                }
                console.log(`\n${colors.bright}Available Graphs:${colors.reset}`);
                const availableGraphs = listGraphs();
                if (availableGraphs.length === 0) {
                    console.log(`  ${colors.gray}(no saved graphs)${colors.reset}`);
                }
                else {
                    availableGraphs.forEach((name) => {
                        const marker = name === currentGraph
                            ? `${colors.green}● ${colors.reset}`
                            : `  `;
                        console.log(`${marker}${name}`);
                    });
                }
            }
            break;
        case "list":
            if (a[0] === "types") {
                console.log(`${colors.bright}${colors.blue}Node Types:${colors.reset}`, colorJSON(Object.keys(schema.node_types)));
                console.log(`${colors.bright}${colors.blue}Edge Types:${colors.reset}`, colorJSON(Object.keys(schema.edge_types)));
                break;
            }
            const nodes = graph.getNodes();
            const edges = graph.getEdges();
            console.log(`${colors.bright}${colors.blue}Nodes (${nodes.length}):${colors.reset}`, nodes.length > 0
                ? colorJSON(nodes)
                : `${colors.gray}(empty)${colors.reset}`);
            console.log(`${colors.bright}${colors.blue}Edges (${edges.length}):${colors.reset}`, edges.length > 0
                ? colorJSON(edges)
                : `${colors.gray}(empty)${colors.reset}`);
            break;
        case "save":
            await exec(`saving`, saveGraph(currentGraph, graph));
            break;
        case "graphs":
        case "ls":
            console.log(listGraphs().join(", "));
            break;
        case "open":
            {
                const name = a[0];
                if (!name)
                    return console.log("open <name>");
                await saveGraph(currentGraph, graph);
                graph = await loadGraph(name, useRealEmbeddings);
                currentGraph = name;
                console.log(`Switched to ${name}`);
                await persist();
            }
            break;
        case "enrich":
            await exec("enriching", graph.scan());
            await persist();
            break;
        case "reload":
            await saveGraph(currentGraph, graph);
            // Clear the terminal
            Deno.stdout.writeSync(new TextEncoder().encode("\x1b[2J\x1b[H"));
            console.log("\nReloading CLI...\n");
            const deno = Deno.execPath();
            const script = fromFileUrl(import.meta.url);
            const proc = new Deno.Command(deno, {
                args: ["run", "-A", script, ...Deno.args],
                stdin: "inherit",
                stdout: "inherit",
                stderr: "inherit",
            }).spawn();
            await proc.status;
            Deno.exit();
            break;
        case "new":
            {
                const name = a[0];
                if (!name)
                    return console.log("new <name>");
                await saveGraph(currentGraph, graph);
                graph = useRealEmbeddings
                    ? new GraphCore(schema)
                    : new GraphCore(schema, { embeddingFn: mockEmbed });
                currentGraph = name;
                console.log(`Created and switched to ${name}`);
                await persist();
            }
            break;
        default:
            console.log("Unknown. /help");
    }
}
if (import.meta.main)
    repl();
//# sourceMappingURL=cli.js.map