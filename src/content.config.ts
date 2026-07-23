import { defineCollection, reference, z } from "astro:content";
import { file, glob } from "astro/loaders";

const blog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "src/content/data/blog" }),
	schema: z.object({
		title: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		tags: z.array(z.string()),
	}),
});

const tags = defineCollection({
	loader: file("src/content/data/tags.json"),
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
	loader: file("src/content/data/projects.json"),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		date: z.string().transform((str) => new Date(str)),
		imageSrc: z.string().optional(),
		deploymentUrl: z.string().optional(),
		sourceUrl: z.string().optional(),
		sortOrder: z.number().default(0),
		tags: z.array(reference("tags")),
	}),
});

export const collections = { blog, projects, tags };
