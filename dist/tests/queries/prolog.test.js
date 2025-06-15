import { assertEquals } from "@std/assert";
import { graphToPrologFacts, queryProlog } from "../../core/prolog.ts";
import { schema } from "../schema.example.ts";
// Helper to load example data
async function loadExampleData() {
    const url = new URL("../../example-data.json", import.meta.url);
    const data = JSON.parse(await Deno.readTextFile(url.pathname));
    // Split into nodes and edges
    const nodes = data.filter((x) => !x.sourceNodeId);
    const edges = data.filter((x) => x.sourceNodeId);
    return { nodes, edges };
}
Deno.test("Prolog integration: find authors of published works", async () => {
    const { nodes, edges } = await loadExampleData();
    // The schema now accurately reflects the shape of our example-data.json
    const facts = graphToPrologFacts(nodes, edges, schema);
    console.log("--- Generated Prolog Facts ---");
    console.log(facts);
    console.log("----------------------------");
    // Query for authors who wrote a publication that is marked as published.
    // We join `wrote(AuthorId, PubId)` with `publication(PubId, ..., true)`.
    const query = "wrote(AuthorId, PubId), publication(PubId, _, _, true).";
    const results = await queryProlog(nodes, edges, schema, query);
    console.log("Query results for authors of published works:", results);
    // From example-data.json:
    // - a1 (Carol) wrote pub1 (published) -> should be found.
    // - a2 (Dave) wrote pub2 (not published) -> should NOT be found.
    // - a1 (Carol) also wrote pub2 (not published) -> should NOT be found.
    assertEquals(results.length, 1);
    assertEquals(results[0].AuthorId, "a1"); // Tau-prolog returns bare atoms without quotes
});
//# sourceMappingURL=prolog.test.js.map