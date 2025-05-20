import { defineCollection, reference, z } from "astro:content";
import { file, glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/data/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    sortOrder: z.number(),
    tags: z.array(z.string()),
  }),
});

const tags = defineCollection({
  loader: file("src/data/tags.json"),
  schema: z.object({
    name: z.string(),
    svgSrc: z.string(),
    sortOrder: z.number().default(0),
    type: z.enum([
      "Programming Language",
      "Framework",
      "Design Framework",
      "Tool",
      "Database",
      "Cloud",
      "Other",
    ]),
  }),
});

const projects = defineCollection({
  loader: file("src/data/projects.json"),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    imageSrc: z.string().optional(),
    deploymentUrl: z.string().optional(),
    sourceUrl: z.string().optional(),
    sortOrder: z.number().default(0),
    tags: z.array(reference("tags")),
  }),
});

// TODO: figure out how to reference tags in projects (use id? name?)

export const collections = { blog, projects, tags };
