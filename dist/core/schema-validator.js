/**
 * Validates a TurtleDB schema configuration for correctness and consistency.
 * Throws an error if the schema is invalid.
 */
export function validateSchema(schema) {
    if (!schema ||
        typeof schema.node_types !== 'object' ||
        typeof schema.edge_types !== 'object') {
        throw new Error("Schema must have 'node_types' and 'edge_types' objects.");
    }
    const nodeNames = new Set(Object.keys(schema.node_types));
    // Validate Node Types
    for (const [name, nodeConfig] of Object.entries(schema.node_types)) {
        if (name !== nodeConfig.name) {
            throw new Error(`Node type key '${name}' does not match its name property '${nodeConfig.name}'.`);
        }
        if (!nodeConfig.description || typeof nodeConfig.description !== 'string') {
            throw new Error(`Node type '${nodeConfig.name}' must have a 'description'.`);
        }
        // Validate Access Control (if present)
        validateAccessControl(nodeConfig.name, nodeConfig.accessControl);
    }
    // Validate Edge Types
    for (const [name, edgeConfig] of Object.entries(schema.edge_types)) {
        if (name !== edgeConfig.name) {
            throw new Error(`Edge type key '${name}' does not match its name property '${edgeConfig.name}'.`);
        }
        if (!edgeConfig.description || typeof edgeConfig.description !== 'string') {
            throw new Error(`Edge type '${edgeConfig.name}' must have a 'description'.`);
        }
        // Validate source and target configurations
        validateEdgeConnection(edgeConfig.name, 'source', edgeConfig.source, nodeNames);
        validateEdgeConnection(edgeConfig.name, 'target', edgeConfig.target, nodeNames);
        // Validate Access Control (if present)
        validateAccessControl(edgeConfig.name, edgeConfig.accessControl);
    }
}
function validateEdgeConnection(edgeTypeName, side, config, // Reusing the type, it's the same structure
existingNodeNames) {
    if (!config) {
        throw new Error(`Edge type '${edgeTypeName}' must have a '${side}' configuration.`);
    }
    if (!config.node_type || typeof config.node_type !== 'string') {
        throw new Error(`Edge type '${edgeTypeName}' ${side} must specify a 'node_type'.`);
    }
    if (!existingNodeNames.has(config.node_type)) {
        throw new Error(`Edge type '${edgeTypeName}' ${side} refers to unknown node type: '${config.node_type}'`);
    }
    if (typeof config.multiple !== 'boolean') {
        throw new Error(`Edge type '${edgeTypeName}' ${side} must specify 'multiple' as a boolean.`);
    }
    if (typeof config.required !== 'boolean') {
        throw new Error(`Edge type '${edgeTypeName}' ${side} must specify 'required' as a boolean.`);
    }
}
function validateAccessControl(entityName, accessControl) {
    if (!accessControl)
        return; // Access control is optional
    if (accessControl.public !== undefined &&
        typeof accessControl.public !== 'boolean') {
        throw new Error(`AccessControl for '${entityName}' has invalid 'public' field. Must be boolean.`);
    }
    if (accessControl.roles !== undefined) {
        if (typeof accessControl.roles !== 'object' ||
            accessControl.roles === null) {
            throw new Error(`AccessControl for '${entityName}' has invalid 'roles' field. Must be an object.`);
        }
        for (const roleName in accessControl.roles) {
            const rolesArray = accessControl.roles[roleName];
            if (!Array.isArray(rolesArray)) {
                throw new Error(`AccessControl for '${entityName}' role '${roleName}' must be an array.`);
            }
            for (const role of rolesArray) {
                if (!['viewer', 'editor', 'owner'].includes(role)) {
                    throw new Error(`AccessControl for '${entityName}' role '${roleName}' contains invalid role: '${role}'. Must be 'viewer', 'editor', or 'owner'.`);
                }
            }
        }
    }
    if (accessControl.defaultAuthenticatedRole !== undefined) {
        if (!['viewer', 'editor', 'owner'].includes(accessControl.defaultAuthenticatedRole)) {
            throw new Error(`AccessControl for '${entityName}' has invalid 'defaultAuthenticatedRole'. Must be 'viewer', 'editor', or 'owner'.`);
        }
    }
}
//# sourceMappingURL=schema-validator.js.map