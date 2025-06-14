// Canonical schema config types for TurtleDB
// Use these to define your app's node and edge types, descriptions, and NLQ hints

// Define roles
export type AccessRole = 'viewer' | 'editor' | 'owner'; // Extend as needed, or base on your auth system

// A simple permissions map for a type or instance
export interface AccessControl {
	/** If true, overrides all other permissions for this entity/type, making it publicly accessible. */
	public?: boolean;
	/**
	 * Role-based access control. Maps specific role names (e.g., 'admin', 'user-id-123')
	 * to an array of allowed actions for this type/instance.
	 * Key can be a specific user ID or a role name.
	 */
	roles?: {
		[roleOrUserId: string]: Array<'read' | 'write' | 'update' | 'delete'>;
	};
	/**
	 * The default role assigned to any authenticated user who is not explicitly
	 * listed in `roles` for this entity/type.
	 */
	defaultAuthenticatedRole?: AccessRole;
	// Future: granular property-level access control, more complex rule definitions
}

export interface NodeSourceTargetConfig {
	node_type: string;
	multiple: boolean; // true for N/M, false for 1
	required: boolean; // true for min 1, false for min 0
	// Future: min/max counts for more specific cardinalities
}

export interface NodeTypeConfig<T = Record<string, any>> {
	/** Unique name for this node type (e.g., 'member', 'post') */
	name: string;
	/** Human-readable description for NLQ and docs */
	description: string;
	/** Synonyms for NLQ mapping (e.g., ['user', 'person']) */
	synonyms?: string[];
	/** Data shape for this node type (TypeScript interface or property map). Using Record<string, any> for flexibility. */
	data: T;
	/** Access control rules for this node type. */
	accessControl?: AccessControl;
	// Future: property metadata, validation, more NLQ hints, etc.
}

export interface EdgeTypeConfig<T = Record<string, any>> {
	/** Unique name for this edge type (e.g., 'knows', 'wrote') */
	name: string;
	/** Human-readable description for NLQ and docs */
	description: string;
	/** Synonyms for NLQ mapping */
	synonyms?: string[];
	/** Source node type configuration and cardinality */
	source: NodeSourceTargetConfig;
	/** Target node type configuration and cardinality */
	target: NodeSourceTargetConfig;
	/** Data shape for this edge type */
	data: T;
	/** Access control rules for this edge type. */
	accessControl?: AccessControl;
	// Future: property metadata, validation, more NLQ hints, etc.
}

export interface TurtleDBSchema {
	nodes: NodeTypeConfig[];
	edges: EdgeTypeConfig[];
}
