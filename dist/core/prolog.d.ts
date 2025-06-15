import type { Edge, Node } from "../types/index.ts";
import type { TurtleDBSchema } from "../types/schema.ts";
export type Fact = Record<string, any>;
export declare class PrologEngine {
    private facts;
    loadFactsFromJSON(path: string): Promise<void>;
    getFacts(): Fact[];
    query(query: Fact): Fact[];
    private unify;
}
/**
 * Exports nodes and edges as Prolog facts, using only schema-driven properties.
 * @param nodes Array of Node objects
 * @param edges Array of Edge objects
 * @param schema The TurtleDBSchema
 * @returns String of Prolog facts
 */
export declare function graphToPrologFacts(nodes: Node[], edges: Edge[], schema: TurtleDBSchema): string;
/**
 * Node.js-native tau-prolog integration
 * Executes Prolog queries using the tau-prolog engine
 */
export declare function queryProlog(nodes: Node[], edges: Edge[], schema: TurtleDBSchema, query: string): Promise<Record<string, any>[]>;
//# sourceMappingURL=prolog.d.ts.map