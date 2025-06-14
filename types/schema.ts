// Canonical schema config types for TurtleDB
// Use these to define your app's node and edge types, descriptions, and NLQ hints
//
// The `name` field in NodeTypeConfig/EdgeTypeConfig is the canonical identifier for the type,
// and is referenced by the `type` field in Node/Edge instances at runtime.

/** Defines the level of access for an entity or type */
export type AccessRole = 'viewer' | 'editor' | 'owner';

/** Specifies access control rules for a schema type or instance */
export interface AccessControl {
  /** If true, this entity/type is publicly accessible (overrides other role-based permissions) */
  public?: boolean;
  /** Role-based access for authenticated users (e.g., { 'admin': ['viewer', 'editor', 'owner'] }) */
  roles?: {
    [roleName: string]: AccessRole[];
  };
  /** Default role for any authenticated user not explicitly listed in roles */
  defaultAuthenticatedRole?: AccessRole;
}

export interface NodeTypeConfig<T = any> {
  /** Unique name for this node type (e.g., 'member', 'post') */
  name: string;
  /** Human-readable description for NLQ and docs */
  description: string;
  /** Synonyms for NLQ mapping (e.g., ['user', 'person']) */
  synonyms?: string[];
  /** Data shape for this node type (TypeScript interface or property map) */
  data: T;
  /** Access control rules for this node type */
  accessControl?: AccessControl;
  // Future: property metadata, validation, NLQ hints, etc.
}

/** Defines the structure and cardinality of a connected node in an edge type */
export interface EdgeConnectionConfig {
  /** The name of the node type connected by this side of the edge */
  node_type: string;
  /** If true, multiple nodes of this type can be connected (many-side of the relationship) */
  multiple: boolean;
  /** If true, at least one node of this type must be connected (required-side of the relationship) */
  required: boolean;
}

export interface EdgeTypeConfig<T = any> {
  /** Unique name for this edge type (e.g., 'knows', 'wrote') */
  name: string;
  /** Human-readable description for NLQ and docs */
  description: string;
  /** Configuration for the source node of the edge, including cardinality */
  source: EdgeConnectionConfig;
  /** Configuration for the target node of the edge, including cardinality */
  target: EdgeConnectionConfig;
  /** Synonyms for NLQ mapping */
  synonyms?: string[];
  /** Data shape for this edge type */
  data: T;
  /** Access control rules for this edge type */
  accessControl?: AccessControl;
  // Future: property metadata, validation, NLQ hints, etc.
}

export interface TurtleDBSchema {
  node_types: { [name: string]: NodeTypeConfig };
  edge_types: { [name: string]: EdgeTypeConfig };
}
