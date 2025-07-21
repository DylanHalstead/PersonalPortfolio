import type { CollectionEntry } from "astro:content";

export function sortPosts(posts: CollectionEntry<"blog">[]) {
	return posts.sort((a, b) => {
		const aDate = a.data.updatedDate || a.data.pubDate;
		const bDate = b.data.updatedDate || b.data.pubDate;
		return new Date(bDate).getTime() - new Date(aDate).getTime();
	});
}
