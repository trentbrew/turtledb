/**
 * TurtleDB React Example
 * Demonstrates how to use TurtleDB with React hooks
 */

import React, { useState } from "react";
import { createTurtleDBHooks } from "turtledb";

// Create TurtleDB hooks with React
const { useGraph, useSearch, useNodes, useEdges, useGraphStats } =
  createTurtleDBHooks(React);

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
};

// Main App Component
function App() {
  return (
    <div className="app">
      <h1>🐢 TurtleDB React Example</h1>
      <div className="layout">
        <div className="sidebar">
          <GraphStats />
          <SearchPanel />
        </div>
        <div className="main">
          <NodeManager />
          <EdgeManager />
        </div>
      </div>
    </div>
  );
}

// Graph Statistics Component
function GraphStats() {
  const { stats, nodesByType, edgesByType, connectivity } = useGraphStats({
    instanceId: "example",
    schema,
  });

  return (
    <div className="stats-panel">
      <h3>📊 Graph Statistics</h3>
      <div className="stat-grid">
        <div className="stat">
          <label>Total Nodes:</label>
          <span>{stats.totalNodes || 0}</span>
        </div>
        <div className="stat">
          <label>Total Edges:</label>
          <span>{stats.totalEdges || 0}</span>
        </div>
      </div>

      <h4>Nodes by Type</h4>
      <ul>
        {Object.entries(nodesByType).map(([type, count]) => (
          <li key={type}>{type}: {count}</li>
        ))}
      </ul>

      <h4>Edges by Type</h4>
      <ul>
        {Object.entries(edgesByType).map(([type, count]) => (
          <li key={type}>{type}: {count}</li>
        ))}
      </ul>
    </div>
  );
}

// Search Panel Component
function SearchPanel() {
  const [query, setQuery] = useState("");
  const { search, results, isSearching, searchError, clearResults } = useSearch(
    {
      instanceId: "example",
    },
  );

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim()) {
      await search(query, 10);
    }
  };

  return (
    <div className="search-panel">
      <h3>🔍 Semantic Search</h3>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by meaning..."
          disabled={isSearching}
        />
        <button type="submit" disabled={isSearching}>
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {searchError && <div className="error">Error: {searchError.message}</div>}

      {results.length > 0 && (
        <div className="search-results">
          <h4>Results ({results.length})</h4>
          <button onClick={clearResults}>Clear</button>
          <ul>
            {results.map((result) => (
              <li key={result.node.id} className="search-result">
                <strong>
                  {result.node.data.name || result.node.data.title}
                </strong>
                <span className="similarity">
                  {(result.similarity * 100).toFixed(1)}% match
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Node Manager Component
function NodeManager() {
  const {
    nodes,
    createNode,
    updateNode,
    deleteNode,
    isLoading,
    error,
  } = useGraph({
    instanceId: "example",
    schema,
    autoLoad: true,
  });

  const [newNode, setNewNode] = useState({
    type: "person",
    name: "",
    email: "",
    role: "student",
  });

  const handleCreateNode = async (e) => {
    e.preventDefault();
    try {
      const { type, ...data } = newNode;
      await createNode(type, data);
      setNewNode({ type: "person", name: "", email: "", role: "student" });
    } catch (err) {
      console.error("Failed to create node:", err);
    }
  };

  const handleDeleteNode = async (id) => {
    if (confirm("Are you sure you want to delete this node?")) {
      try {
        deleteNode(id);
      } catch (err) {
        console.error("Failed to delete node:", err);
      }
    }
  };

  return (
    <div className="node-manager">
      <h3>👥 Node Management</h3>

      {error && <div className="error">Error: {error.message}</div>}

      {/* Create Node Form */}
      <form onSubmit={handleCreateNode} className="create-form">
        <h4>Create New Node</h4>
        <select
          value={newNode.type}
          onChange={(e) => setNewNode({ ...newNode, type: e.target.value })}
        >
          <option value="person">Person</option>
          <option value="article">Article</option>
        </select>

        {newNode.type === "person"
          ? (
            <>
              <input
                type="text"
                placeholder="Name"
                value={newNode.name}
                onChange={(e) =>
                  setNewNode({ ...newNode, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newNode.email}
                onChange={(e) =>
                  setNewNode({ ...newNode, email: e.target.value })}
              />
              <select
                value={newNode.role}
                onChange={(e) =>
                  setNewNode({ ...newNode, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </>
          )
          : (
            <>
              <input
                type="text"
                placeholder="Title"
                value={newNode.title || ""}
                onChange={(e) =>
                  setNewNode({ ...newNode, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Content"
                value={newNode.content || ""}
                onChange={(e) =>
                  setNewNode({ ...newNode, content: e.target.value })}
                required
              />
            </>
          )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Node"}
        </button>
      </form>

      {/* Node List */}
      <div className="node-list">
        <h4>Existing Nodes ({nodes.length})</h4>
        {nodes.map((node) => (
          <div key={node.id} className="node-item">
            <div className="node-header">
              <span className="node-type">{node.type}</span>
              <button
                onClick={() => handleDeleteNode(node.id)}
                className="delete-btn"
              >
                Delete
              </button>
            </div>
            <div className="node-data">
              <strong>{node.data.name || node.data.title}</strong>
              {node.data.email && <div>Email: {node.data.email}</div>}
              {node.data.role && <div>Role: {node.data.role}</div>}
              {node.data.content && (
                <div>Content: {node.data.content.substring(0, 100)}...</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Edge Manager Component
function EdgeManager() {
  const { edges, createEdge, deleteEdge } = useGraph({
    instanceId: "example",
    autoLoad: false,
  });

  const { all: nodes } = useNodes({ instanceId: "example" });

  const [newEdge, setNewEdge] = useState({
    type: "authored",
    sourceId: "",
    targetId: "",
    publishedAt: "",
  });

  const handleCreateEdge = async (e) => {
    e.preventDefault();
    try {
      const { type, sourceId, targetId, ...data } = newEdge;
      createEdge(type, sourceId, targetId, data);
      setNewEdge({
        type: "authored",
        sourceId: "",
        targetId: "",
        publishedAt: "",
      });
    } catch (err) {
      console.error("Failed to create edge:", err);
    }
  };

  const handleDeleteEdge = (id) => {
    if (confirm("Are you sure you want to delete this relationship?")) {
      try {
        deleteEdge(id);
      } catch (err) {
        console.error("Failed to delete edge:", err);
      }
    }
  };

  const people = nodes.filter((n) => n.type === "person");
  const articles = nodes.filter((n) => n.type === "article");

  return (
    <div className="edge-manager">
      <h3>🔗 Relationship Management</h3>

      {/* Create Edge Form */}
      <form onSubmit={handleCreateEdge} className="create-form">
        <h4>Create New Relationship</h4>
        <select
          value={newEdge.type}
          onChange={(e) => setNewEdge({ ...newEdge, type: e.target.value })}
        >
          <option value="authored">Authored</option>
          <option value="follows">Follows</option>
        </select>

        <select
          value={newEdge.sourceId}
          onChange={(e) => setNewEdge({ ...newEdge, sourceId: e.target.value })}
          required
        >
          <option value="">Select source...</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.data.name}
            </option>
          ))}
        </select>

        <select
          value={newEdge.targetId}
          onChange={(e) => setNewEdge({ ...newEdge, targetId: e.target.value })}
          required
        >
          <option value="">Select target...</option>
          {newEdge.type === "authored"
            ? articles.map((article) => (
              <option key={article.id} value={article.id}>
                {article.data.title}
              </option>
            ))
            : people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.data.name}
              </option>
            ))}
        </select>

        {newEdge.type === "authored" && (
          <input
            type="date"
            value={newEdge.publishedAt}
            onChange={(e) =>
              setNewEdge({ ...newEdge, publishedAt: e.target.value })}
          />
        )}

        <button type="submit">Create Relationship</button>
      </form>

      {/* Edge List */}
      <div className="edge-list">
        <h4>Existing Relationships ({edges.length})</h4>
        {edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.sourceNodeId);
          const targetNode = nodes.find((n) => n.id === edge.targetNodeId);

          return (
            <div key={edge.id} className="edge-item">
              <div className="edge-header">
                <span className="edge-type">{edge.type}</span>
                <button
                  onClick={() => handleDeleteEdge(edge.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
              <div className="edge-data">
                <strong>
                  {sourceNode?.data.name || sourceNode?.data.title} →{" "}
                  {targetNode?.data.name || targetNode?.data.title}
                </strong>
                {edge.data.publishedAt && (
                  <div>Published: {edge.data.publishedAt}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;

// Basic CSS styles (would typically be in a separate file)
const styles = `
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

.stats-panel, .search-panel, .node-manager, .edge-manager {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.stat {
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
`;
