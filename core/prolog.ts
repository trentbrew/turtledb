// prolog.ts
// Core Prolog-like engine for querying JSON facts

import type { Node, Edge } from '../types/index.ts';
import type { TurtleDBSchema } from '../types/schema.ts';

export type Fact = Record<string, any>;

export class PrologEngine {
  private facts: Fact[] = [];

  // Load facts from a JSON file (array of objects)
  async loadFactsFromJSON(path: string): Promise<void> {
    const text = await Deno.readTextFile(path);
    const data = JSON.parse(text);
    if (!Array.isArray(data)) {
      throw new Error('JSON file must contain an array of fact objects');
    }
    this.facts.push(...data);
  }

  // Get all loaded facts
  getFacts(): Fact[] {
    return this.facts;
  }

  // Query the loaded facts based on a pattern
  query(query: Fact): Fact[] {
    const solutions: Fact[] = [];

    for (const fact of this.facts) {
      this.unify(query, fact, {}, solutions);
    }

    return solutions;
  }

  private unify(
    queryPattern: Fact,
    fact: Fact,
    bindings: Fact,
    solutions: Fact[],
  ): void {
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

      if (typeof queryValue === 'string' && queryValue.startsWith('$')) {
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
        } else {
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
      } else {
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
        } else if (queryValue !== factValue) {
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
    } else {
      // Removed console.log for clean output
      // console.log("--- Unification Failed for this fact/pattern combination.");
    }
  }
}

/**
 * Converts a value to a Prolog-safe representation.
 * Strings are quoted, numbers/booleans are left as-is, null/undefined become '_'.
 */
function toPrologValue(val: any): string {
  if (val === null || val === undefined) return '_';
  if (typeof val === 'string') {
    // Escape quotes and backslashes
    const escaped = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  return '_'; // fallback for objects/arrays
}

/**
 * Exports nodes and edges as Prolog facts, using only schema-driven properties.
 * @param nodes Array of Node objects
 * @param edges Array of Edge objects
 * @param schema The TurtleDBSchema
 * @returns String of Prolog facts
 */
export function graphToPrologFacts(
  nodes: Node[],
  edges: Edge[],
  schema: TurtleDBSchema,
): string {
  const lines: string[] = [];

  // Nodes
  for (const node of nodes) {
    const nodeType = node.type;
    const nodeSchema = schema.node_types[nodeType];
    if (!nodeSchema) continue; // skip unknown types
    const propKeys = Object.keys(nodeSchema.data || {});
    const args = [
      node.id,
      ...propKeys.map((k) => toPrologValue(node.data?.[k])),
    ];
    lines.push(`${nodeType}(${args.join(', ')}).`);
  }

  // Edges
  for (const edge of edges) {
    const edgeType = edge.type;
    const edgeSchema = schema.edge_types[edgeType];
    if (!edgeSchema) continue;
    const propKeys = Object.keys(edgeSchema.data || {});
    const args = [
      edge.sourceNodeId,
      edge.targetNodeId,
      ...propKeys.map((k) => toPrologValue(edge.data?.[k])),
    ];
    lines.push(`${edgeType}(${args.join(', ')}).`);
  }

  return lines.join('\n');
}

/**
 * Runs a Prolog query on the current graph using Tau Prolog.
 * @param nodes Array of Node objects
 * @param edges Array of Edge objects
 * @param schema The TurtleDBSchema
 * @param query The Prolog query string (e.g., 'author(Id, _, "Smith", _).')
 * @returns Promise resolving to an array of variable bindings (JS objects)
 *
 * Example:
 *   const results = await queryProlog(nodes, edges, schema, 'author(Id, _, "Smith", _).');
 *   // results: [ { Id: 'a1' }, ... ]
 */
export async function queryProlog(
  nodes: Node[],
  edges: Edge[],
  schema: TurtleDBSchema,
  query: string,
): Promise<Record<string, any>[]> {
  const pl =
    (await import('tau-prolog')).default || (await import('tau-prolog'));
  // Optionally import lists module if needed
  // If you need lists, dynamically import and register the module
  try {
    const listsModule = await import('tau-prolog/modules/lists.js');
    if (typeof listsModule.default === 'function') listsModule.default(pl);
  } catch (e) {
    // lists module not found or not needed; ignore
  }

  const session = pl.create(10000); // 10k steps limit
  const facts = graphToPrologFacts(nodes, edges, schema);

  // Load facts
  await new Promise<void>((resolve, reject) => {
    session.consult(facts, {
      success: () => resolve(),
      error: (err: any) => reject(new Error('Prolog consult error: ' + err)),
    });
  });

  // Load query
  await new Promise<void>((resolve, reject) => {
    session.query(query, {
      success: () => resolve(),
      error: (err: any) => reject(new Error('Prolog query error: ' + err)),
    });
  });

  // Collect all answers
  const results: Record<string, any>[] = [];
  await new Promise<void>((resolve, reject) => {
    function next() {
      session.answer({
        success: (answer: any) => {
          if (pl.type.is_substitution(answer)) {
            // Convert answer to JS object
            const vars = Object.keys(answer.links);
            const obj: Record<string, any> = {};
            for (const v of vars) {
              const term = answer.links[v];
              if (term) {
                // term.toString() gives the Prolog representation.
                // e.g., atom 'a1' -> "a1", string "hello" -> "'hello'"
                let value = term.toString();
                if (term.is_string && term.is_string()) {
                  // Remove the surrounding single quotes for strings
                  value = value.slice(1, -1);
                }
                obj[v] = value;
              }
            }
            results.push(obj);
            next();
          } else {
            resolve();
          }
        },
        fail: () => resolve(),
        error: (err: any) => reject(new Error('Prolog answer error: ' + err)),
        limit: () => resolve(),
      });
    }
    next();
  });

  return results;
}
