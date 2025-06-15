# 📋 Schema Design Guide

A well-designed schema is the foundation of any successful graph database. This
guide will teach you how to design schemas that are flexible, performant, and
maintainable.

## 🎯 Schema Philosophy

TurtleDB schemas follow these core principles:

1. **Type Safety First** - Catch errors at schema definition time
2. **Semantic Clarity** - Names and descriptions should be self-documenting
3. **Flexible Relationships** - Support complex, real-world connections
4. **Evolution-Friendly** - Design for change and growth
5. **Performance-Aware** - Consider embedding and search implications

## 🏗️ Schema Structure

Every TurtleDB schema has two main components:

```javascript
const schema = {
  node_types: {
    // Define your entities (nouns)
  },
  edge_types: {
    // Define your relationships (verbs)
  },
};
```

## 📦 Node Types: Your Entities

Node types represent the "things" in your domain. Think of them as the nouns in
your data model.

### Basic Node Type

```javascript
const schema = {
  node_types: {
    user: {
      name: "user", // Must match the key
      description: "A system user", // Human-readable description
      data: {
        // Field definitions go here
      },
    },
  },
};
```

### Field Types

TurtleDB supports several field types:

#### String Fields

```javascript
data: {
  name: {
    type: 'string',
    required: true
  },
  bio: {
    type: 'string',
    required: false
  },
  role: {
    type: 'string',
    enum: ['admin', 'user', 'guest'],  // Constrain to specific values
    required: true
  }
}
```

#### Number Fields

```javascript
data: {
  age: {
    type: 'number',
    required: false
  },
  score: {
    type: 'number',
    required: true
  }
}
```

#### Boolean Fields

```javascript
data: {
  isActive: {
    type: 'boolean',
    required: true
  },
  emailVerified: {
    type: 'boolean',
    required: false
  }
}
```

#### Array Fields

```javascript
data: {
  tags: {
    type: 'array',
    required: false
  },
  skills: {
    type: 'array',
    required: true
  }
}
```

### Real-World Node Examples

#### User/Person Node

```javascript
person: {
  name: 'person',
  description: 'A person who uses the system',
  data: {
    // Identity
    name: { type: 'string', required: true },
    email: { type: 'string', required: false },
    username: { type: 'string', required: false },

    // Profile
    bio: { type: 'string', required: false },
    avatar: { type: 'string', required: false },
    location: { type: 'string', required: false },

    // Metadata
    role: {
      type: 'string',
      enum: ['admin', 'moderator', 'user', 'guest'],
      required: true
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'suspended'],
      required: true
    },

    // Preferences
    preferences: { type: 'array', required: false },
    skills: { type: 'array', required: false },

    // Timestamps
    createdAt: { type: 'string', required: false },
    lastLoginAt: { type: 'string', required: false }
  }
}
```

#### Content Node

```javascript
article: {
  name: 'article',
  description: 'A piece of written content',
  data: {
    // Core content
    title: { type: 'string', required: true },
    content: { type: 'string', required: true },
    excerpt: { type: 'string', required: false },

    // Categorization
    category: {
      type: 'string',
      enum: ['technology', 'science', 'business', 'health', 'entertainment'],
      required: true
    },
    tags: { type: 'array', required: false },

    // Publishing
    status: {
      type: 'string',
      enum: ['draft', 'published', 'archived'],
      required: true
    },
    publishedAt: { type: 'string', required: false },

    // Metadata
    language: { type: 'string', required: false },
    readingTime: { type: 'number', required: false },
    wordCount: { type: 'number', required: false },

    // SEO
    slug: { type: 'string', required: false },
    metaDescription: { type: 'string', required: false }
  }
}
```

#### Organization Node

```javascript
organization: {
  name: 'organization',
  description: 'A company, team, or group',
  data: {
    // Identity
    name: { type: 'string', required: true },
    displayName: { type: 'string', required: false },
    description: { type: 'string', required: false },

    // Contact
    website: { type: 'string', required: false },
    email: { type: 'string', required: false },
    phone: { type: 'string', required: false },

    // Location
    address: { type: 'string', required: false },
    city: { type: 'string', required: false },
    country: { type: 'string', required: false },

    // Classification
    type: {
      type: 'string',
      enum: ['company', 'nonprofit', 'government', 'educational'],
      required: true
    },
    industry: { type: 'string', required: false },
    size: {
      type: 'string',
      enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
      required: false
    },

    // Metadata
    founded: { type: 'string', required: false },
    logo: { type: 'string', required: false }
  }
}
```

## 🔗 Edge Types: Your Relationships

Edge types define how your entities connect. Think of them as the verbs in your
data model.

### Basic Edge Type

```javascript
const schema = {
  edge_types: {
    follows: {
      name: "follows",
      description: "One user follows another",
      source: {
        node_type: "user",
        multiple: true, // One user can follow many others
        required: false,
      },
      target: {
        node_type: "user",
        multiple: true, // One user can be followed by many
        required: false,
      },
      data: {
        // Additional relationship data
        followedAt: { type: "string", required: false },
      },
    },
  },
};
```

### Cardinality Patterns

#### One-to-Many

```javascript
// One user can author many articles
authored: {
  name: 'authored',
  description: 'User authored an article',
  source: {
    node_type: 'user',
    multiple: true,     // Many users can be sources
    required: false
  },
  target: {
    node_type: 'article',
    multiple: false,    // Each article has one primary author
    required: false
  },
  data: {
    role: {
      type: 'string',
      enum: ['primary', 'contributor', 'editor'],
      required: false
    },
    publishedAt: { type: 'string', required: false }
  }
}
```

#### Many-to-Many

```javascript
// Users can belong to many organizations, organizations can have many users
member_of: {
  name: 'member_of',
  description: 'User is a member of an organization',
  source: {
    node_type: 'user',
    multiple: true,     // Many users can be members
    required: false
  },
  target: {
    node_type: 'organization',
    multiple: true,     // User can be member of many orgs
    required: false
  },
  data: {
    role: {
      type: 'string',
      enum: ['owner', 'admin', 'member', 'guest'],
      required: true
    },
    joinedAt: { type: 'string', required: false },
    permissions: { type: 'array', required: false }
  }
}
```

#### Self-Referencing

```javascript
// Users can follow other users
follows: {
  name: 'follows',
  description: 'User follows another user',
  source: { node_type: 'user', multiple: true, required: false },
  target: { node_type: 'user', multiple: true, required: false },
  data: {
    followedAt: { type: 'string', required: false },
    notifications: { type: 'boolean', required: false }
  }
},

// Articles can reference other articles
references: {
  name: 'references',
  description: 'Article references another article',
  source: { node_type: 'article', multiple: true, required: false },
  target: { node_type: 'article', multiple: true, required: false },
  data: {
    type: {
      type: 'string',
      enum: ['citation', 'related', 'sequel', 'update'],
      required: false
    }
  }
}
```

## 🎨 Design Patterns

### The Hub Pattern

Create central nodes that connect many related entities:

```javascript
// Project as a hub connecting people, tasks, and documents
project: {
  name: 'project',
  description: 'A project that organizes work',
  data: {
    name: { type: 'string', required: true },
    description: { type: 'string', required: false },
    status: {
      type: 'string',
      enum: ['planning', 'active', 'completed', 'cancelled'],
      required: true
    }
  }
},

// Edges connecting to the hub
assigned_to: {
  name: 'assigned_to',
  description: 'User is assigned to a project',
  source: { node_type: 'user', multiple: true, required: false },
  target: { node_type: 'project', multiple: true, required: false }
},

contains: {
  name: 'contains',
  description: 'Project contains a task',
  source: { node_type: 'project', multiple: false, required: false },
  target: { node_type: 'task', multiple: true, required: false }
}
```

### The Hierarchy Pattern

Model hierarchical relationships:

```javascript
// Categories with subcategories
category: {
  name: 'category',
  description: 'A content category',
  data: {
    name: { type: 'string', required: true },
    description: { type: 'string', required: false },
    level: { type: 'number', required: false }
  }
},

// Self-referencing hierarchy
subcategory_of: {
  name: 'subcategory_of',
  description: 'Category is a subcategory of another',
  source: { node_type: 'category', multiple: true, required: false },
  target: { node_type: 'category', multiple: false, required: false },
  data: {
    order: { type: 'number', required: false }
  }
}
```

### The Timeline Pattern

Model temporal relationships:

```javascript
event: {
  name: 'event',
  description: 'Something that happened at a specific time',
  data: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: false },
    timestamp: { type: 'string', required: true },
    type: {
      type: 'string',
      enum: ['created', 'updated', 'deleted', 'published'],
      required: true
    }
  }
},

// Events can follow each other
follows_event: {
  name: 'follows_event',
  description: 'Event follows another event',
  source: { node_type: 'event', multiple: false, required: false },
  target: { node_type: 'event', multiple: true, required: false },
  data: {
    duration: { type: 'number', required: false }
  }
}
```

## 🔍 Semantic Search Considerations

Design your schema with semantic search in mind:

### Rich Content Fields

Include fields that provide semantic context:

```javascript
product: {
  name: 'product',
  description: 'A product in our catalog',
  data: {
    // Basic info
    name: { type: 'string', required: true },

    // Rich semantic content - these will be embedded!
    description: { type: 'string', required: true },
    features: { type: 'array', required: false },
    benefits: { type: 'string', required: false },
    useCase: { type: 'string', required: false },

    // Structured data
    category: { type: 'string', required: true },
    price: { type: 'number', required: false },

    // SEO content - also great for embeddings
    keywords: { type: 'array', required: false },
    marketingCopy: { type: 'string', required: false }
  }
}
```

### Meaningful Descriptions

Write descriptions that help with auto-tagging:

```javascript
// Good: Descriptive and semantic
research_paper: {
  name: 'research_paper',
  description: 'Academic research paper with findings and methodology',
  data: {
    title: { type: 'string', required: true },
    abstract: { type: 'string', required: true },    // Great for embeddings!
    methodology: { type: 'string', required: false }, // Semantic context
    findings: { type: 'string', required: false },    // Key insights
    keywords: { type: 'array', required: false }      // Explicit tags
  }
}

// Less ideal: Generic and sparse
document: {
  name: 'document',
  description: 'A document',
  data: {
    title: { type: 'string', required: true },
    content: { type: 'string', required: false }
  }
}
```

## ⚡ Performance Tips

### Embedding Optimization

- **Rich text fields** generate better embeddings than sparse data
- **Combine related fields** in auto-descriptions for better semantic
  understanding
- **Use meaningful enums** - they provide semantic context

### Relationship Efficiency

- **Avoid deeply nested hierarchies** - they can impact traversal performance
- **Use hub patterns** for highly connected data
- **Consider soft links** for discovered relationships vs. explicit edges

## 🔄 Schema Evolution

Design for change from the beginning:

### Versioning Strategy

```javascript
// Include version information
const schema = {
  version: "1.0.0",
  node_types: {
    // Your types
  },
  edge_types: {
    // Your relationships
  },
};
```

### Backward Compatibility

- **Make new fields optional** when adding to existing types
- **Use enums carefully** - adding values is safe, removing them is not
- **Deprecate gracefully** - mark old fields as deprecated before removing

### Migration Planning

```javascript
// Example: Adding a new field
user: {
  name: 'user',
  description: 'A system user',
  data: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: false },

    // New field - optional for backward compatibility
    timezone: { type: 'string', required: false }  // ✅ Safe to add
  }
}

// Example: Changing requirements
user: {
  name: 'user',
  description: 'A system user',
  data: {
    name: { type: 'string', required: true },
    // email: { type: 'string', required: true },  // ❌ Breaking change!
    email: { type: 'string', required: false },    // ✅ Keep optional
    emailVerified: { type: 'boolean', required: false }  // ✅ Add verification
  }
}
```

## 🎯 Best Practices

### Naming Conventions

- **Use clear, descriptive names** for types and fields
- **Be consistent** with naming patterns (camelCase vs snake_case)
- **Use verbs for edge types** (`follows`, `authored`, `belongs_to`)
- **Use nouns for node types** (`user`, `article`, `organization`)

### Field Design

- **Start with required fields minimal** - you can always add more
- **Use enums for controlled vocabularies** - they improve data quality
- **Include timestamps** for audit trails and temporal queries
- **Add semantic fields** for better embedding quality

### Relationship Design

- **Model real-world relationships** - don't force artificial constraints
- **Use descriptive edge data** to capture relationship context
- **Consider cardinality carefully** - it affects data integrity
- **Plan for soft links** - let embeddings discover hidden relationships

## 🧪 Testing Your Schema

Before deploying, test your schema design:

```javascript
import { validateSchema } from "turtle-db";

try {
  validateSchema(schema);
  console.log("✅ Schema is valid!");
} catch (error) {
  console.error("❌ Schema validation failed:", error.message);
}
```

## 📚 Example: Complete E-commerce Schema

Here's a complete schema for an e-commerce platform:

```javascript
const ecommerceSchema = {
  node_types: {
    customer: {
      name: "customer",
      description: "A customer who purchases products",
      data: {
        name: { type: "string", required: true },
        email: { type: "string", required: true },
        phone: { type: "string", required: false },
        address: { type: "string", required: false },
        preferences: { type: "array", required: false },
        loyaltyTier: {
          type: "string",
          enum: ["bronze", "silver", "gold", "platinum"],
          required: false,
        },
      },
    },

    product: {
      name: "product",
      description: "A product available for purchase",
      data: {
        name: { type: "string", required: true },
        description: { type: "string", required: true },
        price: { type: "number", required: true },
        category: { type: "string", required: true },
        brand: { type: "string", required: false },
        features: { type: "array", required: false },
        inStock: { type: "boolean", required: true },
        sku: { type: "string", required: true },
      },
    },

    order: {
      name: "order",
      description: "A customer order",
      data: {
        orderNumber: { type: "string", required: true },
        total: { type: "number", required: true },
        status: {
          type: "string",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
          required: true,
        },
        orderDate: { type: "string", required: true },
        shippingAddress: { type: "string", required: false },
      },
    },

    review: {
      name: "review",
      description: "A customer review of a product",
      data: {
        rating: { type: "number", required: true },
        title: { type: "string", required: false },
        content: { type: "string", required: false },
        verified: { type: "boolean", required: true },
        reviewDate: { type: "string", required: true },
      },
    },
  },

  edge_types: {
    placed: {
      name: "placed",
      description: "Customer placed an order",
      source: { node_type: "customer", multiple: true, required: false },
      target: { node_type: "order", multiple: false, required: false },
      data: {},
    },

    contains: {
      name: "contains",
      description: "Order contains a product",
      source: { node_type: "order", multiple: true, required: false },
      target: { node_type: "product", multiple: true, required: false },
      data: {
        quantity: { type: "number", required: true },
        unitPrice: { type: "number", required: true },
      },
    },

    reviewed: {
      name: "reviewed",
      description: "Customer reviewed a product",
      source: { node_type: "customer", multiple: true, required: false },
      target: { node_type: "product", multiple: true, required: false },
      data: {
        reviewId: { type: "string", required: true },
      },
    },

    review_of: {
      name: "review_of",
      description: "Review is of a specific product",
      source: { node_type: "review", multiple: false, required: false },
      target: { node_type: "product", multiple: true, required: false },
      data: {},
    },
  },
};
```

## 🚀 Next Steps

Now that you understand schema design, explore:

1. **[Embedding & Search Guide](./embeddings.md)** - Optimize for semantic
   search
2. **[API Reference](./api.md)** - Learn all the methods
3. **[Framework Integration](./frameworks.md)** - Connect to your frontend

Remember: **Great schemas evolve**. Start simple, iterate based on real usage,
and always prioritize clarity over complexity! 🎯
