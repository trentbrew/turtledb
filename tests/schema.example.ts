import type { TurtleDBSchema } from "../types/schema.ts";

// Example schema config for a social app (moved from demo/schema.example.ts)
export const schema: TurtleDBSchema = {
  node_types: {
    member: {
      name: "member",
      description: "A user/member of the app",
      synonyms: ["user", "person"],
      data: {
        firstName: "string",
        lastName: "string",
        email: "string",
        isActive: "boolean",
      },
    },
    author: {
      name: "author",
      description: "An author of a publication",
      data: {
        firstName: "string",
        lastName: "string",
        email: "string",
        isActive: "boolean",
      },
    },
    post: {
      name: "post",
      description: "A blog post or article",
      data: {
        title: "string",
        content: "string",
        published: "boolean",
      },
    },
    publication: {
      name: "publication",
      description: "An academic or formal publication",
      data: {
        title: "string",
        content: "string",
        published: "boolean",
      },
    },
  },
  edge_types: {
    wrote: {
      name: "wrote",
      description: "Connects an author to a publication they wrote",
      source: { node_type: "author", multiple: true, required: true },
      target: { node_type: "publication", multiple: false, required: true },
      data: {},
    },
  },
};
