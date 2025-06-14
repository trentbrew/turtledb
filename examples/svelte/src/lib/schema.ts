// Example TurtleDB schema for demo purposes

export const schema = {
	node_types: {
		Person: {
			name: 'Person',
			description: 'A person node',
			synonyms: ['user', 'individual'],
			data: {
				name: 'string',
				age: 'number',
				email: 'string'
			}
		},
		Company: {
			name: 'Company',
			description: 'A company node',
			synonyms: ['business', 'organization'],
			data: {
				name: 'string',
				industry: 'string'
			}
		}
	},
	edge_types: {
		Employment: {
			name: 'Employment',
			description: 'Employment relationship',
			source: { node_type: 'Person', multiple: true, required: false },
			target: { node_type: 'Company', multiple: true, required: false },
			data: {
				title: 'string',
				since: 'string'
			}
		}
	}
};
