// prolog.ts
// Core Prolog-like engine for querying JSON facts - Node.js version
import { readFile } from "node:fs/promises";
export class PrologEngine {
    facts = [];
    // Load facts from a JSON file (array of objects)
    async loadFactsFromJSON(path) {
        const text = await readFile(path, "utf-8");
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
            throw new Error("JSON file must contain an array of fact objects");
        }
        this.facts.push(...data);
    }
    // Get all loaded facts
    getFacts() {
        return this.facts;
    }
    // Query the loaded facts based on a pattern
    query(query) {
        const solutions = [];
        for (const fact of this.facts) {
            this.unify(query, fact, {}, solutions);
        }
        return solutions;
    }
    unify(queryPattern, fact, bindings, solutions) {
        // Removed console.log for clean output
        // console.log("\n--- Attempting Unification ---");
        // console.log("Query Pattern:", queryPattern);
        // console.log("Fact:", fact);
        // console.log("Initial Bindings:", bindings);
        let currentBindings = { ...bindings };
        let unified = true;
        for (const key in queryPattern) {
            const queryValue = queryPattern[key];
            const factValue = fact[key];
            // Removed console.log for clean output
            // console.log(`  Comparing key '${key}': queryValue=${queryValue}, factValue=${factValue}`);
            if (factValue === undefined) {
                // Removed console.log for clean output
                // console.log(`    Fact does not have key '${key}'. Unification fails.`);
                unified = false;
                break;
            }
            if (typeof queryValue === "string" && queryValue.startsWith("$")) {
                // It's a variable
                const varName = queryValue.substring(1); // Remove the '$' prefix
                // Removed console.log for clean output
                // console.log(`    Key '${key}' is a variable: ${varName}`);
                if (varName in currentBindings) {
                    // Variable already bound, check if new value unifies with existing binding
                    // Removed console.log for clean output
                    // console.log(`      Variable '${varName}' already bound to:`, currentBindings[varName]);
                    if (currentBindings[varName] !== factValue) {
                        // Removed console.log for clean output
                        // console.log(`        Value '${factValue}' does not match existing binding. Unification fails.`);
                        unified = false;
                        break;
                    }
                    // Removed console.log for clean output
                    // console.log(`        Value '${factValue}' matches existing binding.`);
                }
                else {
                    // Bind variable
                    currentBindings[varName] = factValue;
                    // Removed console.log for clean output
                    // console.log(`      Binding variable '${varName}' to:`, factValue);
                }
                // Special handling for array values when a variable is binding to them
                if (Array.isArray(factValue)) {
                    // Removed console.log for clean output
                    // console.log(`    Fact value for '${key}' is an array. Iterating through elements.`);
                    for (const item of factValue) {
                        const newBindings = { ...currentBindings, [varName]: item };
                        solutions.push(newBindings);
                        // Removed console.log for clean output
                        // console.log(`      Added solution from array element:`, newBindings);
                    }
                    unified = false; // This fact handled through array iteration, so don't add the original binding directly
                    break; // Stop processing this fact; solutions are added in the loop
                }
            }
            else {
                // It's a concrete value, must match exactly or exist within an array
                if (Array.isArray(factValue)) {
                    // Removed console.log for clean output
                    // console.log(`    Fact value for '${key}' is an array. Checking if concrete value '${queryValue}' exists within it.`);
                    // If the fact value is an array, check if the query value exists within it
                    if (!factValue.includes(queryValue)) {
                        // Removed console.log for clean output
                        // console.log(`      Concrete value '${queryValue}' not found in array. Unification fails.`);
                        unified = false;
                        break;
                    }
                    // Removed console.log for clean output
                    // console.log(`      Concrete value '${queryValue}' found in array.`);
                }
                else if (queryValue !== factValue) {
                    // Direct comparison for non-array values
                    // Removed console.log for clean output
                    // console.log(`    Concrete value '${queryValue}' does not match '${factValue}'. Unification fails.`);
                    unified = false;
                    break;
                }
                // Removed console.log for clean output
                // console.log(`    Concrete value '${queryValue}' matches '${factValue}'.`);
            }
        }
        if (unified) {
            solutions.push(currentBindings);
            // Removed console.log for clean output
            // console.log("--- Unification Succeeded! Added solution:", currentBindings);
        }
        else {
            // Removed console.log for clean output
            // console.log("--- Unification Failed for this fact/pattern combination.");
        }
    }
}
/**
 * Converts a value to a Prolog-safe representation.
 * Strings are quoted, numbers/booleans are left as-is, null/undefined become '_'.
 */
function toPrologValue(val) {
    if (val === null || val === undefined)
        return "_";
    if (typeof val === "string") {
        // Escape quotes and backslashes
        const escaped = val.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        return `"${escaped}"`;
    }
    if (typeof val === "number" || typeof val === "boolean")
        return String(val);
    return "_"; // fallback for objects/arrays
}
/**
 * Exports nodes and edges as Prolog facts, using only schema-driven properties.
 * @param nodes Array of Node objects
 * @param edges Array of Edge objects
 * @param schema The TurtleDBSchema
 * @returns String of Prolog facts
 */
export function graphToPrologFacts(nodes, edges, schema) {
    const lines = [];
    // Nodes
    for (const node of nodes) {
        const nodeType = node.type;
        const nodeSchema = schema.node_types[nodeType];
        if (!nodeSchema)
            continue; // skip unknown types
        const propKeys = Object.keys(nodeSchema.data || {});
        const args = [
            node.id,
            ...propKeys.map((k) => toPrologValue(node.data?.[k])),
        ];
        lines.push(`${nodeType}(${args.join(", ")}).`);
    }
    // Edges
    for (const edge of edges) {
        const edgeType = edge.type;
        const edgeSchema = schema.edge_types[edgeType];
        if (!edgeSchema)
            continue;
        const propKeys = Object.keys(edgeSchema.data || {});
        const args = [
            edge.sourceNodeId,
            edge.targetNodeId,
            ...propKeys.map((k) => toPrologValue(edge.data?.[k])),
        ];
        lines.push(`${edgeType}(${args.join(", ")}).`);
    }
    return lines.join("\n");
}
/**
 * Node.js-native tau-prolog integration
 * Executes Prolog queries using the tau-prolog engine
 */
export async function queryProlog(nodes, edges, schema, query) {
    // Dynamic import for tau-prolog (ES modules)
    const pl = await import("tau-prolog");
    // Note: Lists module not available in this version of tau-prolog
    // Generate Prolog facts from graph data
    const facts = graphToPrologFacts(nodes, edges, schema);
    console.log("--- Generated Prolog Facts ---");
    console.log(facts);
    console.log("----------------------------");
    // Create a new Prolog session
    const session = (pl.default || pl).create(1000);
    return new Promise((resolve, reject) => {
        // Consult the facts
        session.consult(facts, {
            success: () => {
                // Query the goal
                session.query(query, {
                    success: (goal) => {
                        const results = [];
                        // Collect all answers
                        function next() {
                            session.answer({
                                success: (answer) => {
                                    if (answer) {
                                        // Convert tau-prolog answer to plain object
                                        const result = {};
                                        for (const key in answer.links) {
                                            const value = answer.links[key];
                                            if (value && typeof value === "object" && "id" in value) {
                                                result[key] = value.id;
                                            }
                                            else {
                                                result[key] = value;
                                            }
                                        }
                                        results.push(result);
                                    }
                                    next(); // Get next answer
                                },
                                fail: () => {
                                    resolve(results);
                                },
                                error: (err) => {
                                    reject(new Error(`Prolog execution error: ${err}`));
                                },
                                limit: () => {
                                    resolve(results);
                                },
                            });
                        }
                        next();
                    },
                    error: (err) => {
                        reject(new Error(`Prolog query error: ${err}`));
                    },
                });
            },
            error: (err) => {
                reject(new Error(`Prolog consult error: ${err}`));
            },
        });
    });
}
//# sourceMappingURL=prolog.js.map