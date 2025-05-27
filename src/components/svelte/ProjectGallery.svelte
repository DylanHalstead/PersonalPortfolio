<script lang="ts">
  import type { CollectionEntry } from 'astro:content';
  import { onMount } from 'svelte';

  const PROJECTS_PER_PAGE = 6;

  export let projects: CollectionEntry<'projects'>[];
  export let tags: CollectionEntry<'tags'>[];

  let cachedSvgs: Record<string, string> = {};
  async function loadSvgContent(svgPath: string): Promise<string> {
    if (svgPath in cachedSvgs) {
      return cachedSvgs[svgPath];
    }
    
    try {
      const res = await fetch(svgPath);
      const svgContent = await res.text();
      cachedSvgs = { ...cachedSvgs, [svgPath]: svgContent };
      return svgContent;
    } catch (error) {
      console.error(`Failed to load SVG: ${svgPath}`, error);
      return '';
    }
  }

  const unknownTag: CollectionEntry<'tags'> = {
    id: '-1',
    collection: 'tags' as const,
    data: {
      type: 'Other',
      name: 'Unknown',
      svgSrc: '/tags/default.svg',
      sortOrder: -1
    }
  }
  
  onMount(async () => {
    const uniqueSvgPaths = new Set([...tags, unknownTag].map(tag => tag.data.svgSrc));
    await Promise.all(
      Array.from(uniqueSvgPaths).map(path => loadSvgContent(path))
    );
  });

  $: resolvedProjects = projects.map(project => ({
    ...project,
    data: {
      ...project.data,
      tags: project.data.tags
        .map(tagRef => tags.find(t => t.id === tagRef.id) || unknownTag)
    }
  }));

  function sortBySortOrder<T extends { data: { sortOrder: number } }>(a: T, b: T) {
    return a.data.sortOrder - b.data.sortOrder;
  }

  $: sortedTags = [...tags].sort(sortBySortOrder);

  let selectedTags: string[] = [];
  $: sortedProjects = selectedTags.length === 0
    ? resolvedProjects
    : [...resolvedProjects].sort((a, b) => {
        const aMatches = a.data.tags.filter(tag => selectedTags.includes(tag.id)).length;
        const bMatches = b.data.tags.filter(tag => selectedTags.includes(tag.id)).length;
        // Order by number of matches, then by sortOrder
        const aScore = aMatches + (1 / (a.data.sortOrder + 1));
        const bScore = bMatches + (1 / (b.data.sortOrder + 1));
        return bScore - aScore;
      });
  
  let currentPage = 1;
  $: totalPages = Math.ceil(sortedProjects.length / PROJECTS_PER_PAGE);
  $: paginatedProjects = sortedProjects.slice(
    (currentPage - 1) * PROJECTS_PER_PAGE,
    currentPage * PROJECTS_PER_PAGE
  );
  
  function toggleTag(tagId: string) {
    selectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    // Reset to first page when filter changes
    currentPage = 1; 
  }
  
  let dialog: HTMLDialogElement;
  let selectedProject: typeof resolvedProjects[0] | null = null;
  function openModal(project: typeof resolvedProjects[0]) {
    selectedProject = project;
    dialog.showModal();
  }
  
  function closeModal() {
    dialog.close();
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-4">Filter by Tags</h2>
    <ul class="flex flex-wrap gap-2">
      {#each sortedTags as tag}
        <li>
          <button
            class="border-2 px-3 py-2 rounded-full transition-colors duration-200 flex items-center gap-2 cursor-pointer {selectedTags.includes(tag.id) 
              ? 'text-primary-400' 
              : 'bg-background-900 hover:bg-background-800 text-text-100 border-zinc-600'}"
            on:click={() => toggleTag(tag.id)}
          >
            <span class="size-6">
              {@html cachedSvgs[tag.data.svgSrc] || cachedSvgs['/tags/default.svg']}
            </span>
            <p class="text-md">
              {tag.data.name}
            </p>
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each paginatedProjects as project}
      <button
        class="w-full"
        on:click={() => openModal(project)}
      >
        <div class="bg-background-900 border-2 border-zinc-600 rounded-xl transition-transform duration-200 hover:scale-105 cursor-pointer">
          <!-- TODO: verify this lazy is needed/wanted -->
          <enhanced:img 
            src={project.data.imageSrc || "/projects/fallback.png"} 
            alt={project.data.title}
            class="w-full h-56 object-cover rounded-t-xl"
            loading="lazy"
          />
          <div class="py-2 px-4 flex justify-between items-center text-text-100 border-t-2 border-zinc-600">
            <div class="flex flex-col items-start text-left">
              <h3 class="text-2xl font-bold truncate max-w-62">{project.data.title}</h3>
              <p class="opacity-50">{project.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short'})}</p>
            </div>
            <div class="flex gap-2.5 items-center">
              {#each project.data.tags.sort((a, b) => {
                const aSelected = selectedTags.includes(a.id);
                const bSelected = selectedTags.includes(b.id);
                // Sort by selected tags, then by sortOrder
                const aScore = aSelected ? 1 + (1 / (a.data.sortOrder + 1)) : a.data.sortOrder + 1;
                const bScore = bSelected ? 1 + (1 / (b.data.sortOrder + 1)) : b.data.sortOrder + 1;
                return aScore - bScore;
              }).slice(0, 4) as tag, i}
                <span class="text-xl size-9 flex items-center justify-center bg-background-800 rounded-md p-1.5 {selectedTags.includes(tag.id) && 'text-primary-400'}">
                  {#if i === 3 && project.data.tags.length > 4}
                    +{project.data.tags.length - 3}
                  {:else}
                    {@html cachedSvgs[tag.data.svgSrc] || cachedSvgs['/tags/default.svg']}
                  {/if}
                </span>
              {/each}
            </div>
          </div>
        </div>
      </button>
    {/each}
  </div>

  {#if totalPages > 1}
    <div class="flex justify-center mt-8 text-text-100/80">
      <button
        class="p-3 rounded-l hover:text-primary-100 cursor-pointer disabled:opacity-50 disabled:cursor-default"
        on:click={() => currentPage = 1}
        aria-label="Previous Page"
        disabled={currentPage === 1}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="size-6 stroke-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>      
      </button>
      {#each Array(totalPages) as _, i}
        <button
          class="p-3 text-text-100 disabled:text-primary-400 cursor-pointer disabled:cursor-default hover:text-primary-100"
          on:click={() => currentPage = i + 1}
          aria-label="Page {i + 1}"
          disabled={currentPage === i + 1}
        >
          <svg viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="size-2">
            <circle cx="50" cy="50" r="50" />
          </svg>        
        </button>
      {/each}
      <button
        class="p-3 rounded-r hover:text-primary-100 cursor-pointer disabled:opacity-50 disabled:cursor-default"
        on:click={() => currentPage = totalPages}
        aria-label="Next Page"
        disabled={currentPage === totalPages}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="size-6 stroke-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  {/if}

  <!-- TODO: possibly add close on click outside https://stackoverflow.com/questions/25864259/how-to-close-the-new-html-dialog-tag-by-clicking-on-its-backdrop -->
  <dialog
    bind:this={dialog}
    class="bg-background-800 text-text-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 backdrop:bg-black/50 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    on:click|stopPropagation={(e) => {
      if (e.target === dialog) {
        closeModal();
      }
    }}
  >
    <div class="relative">
      <img 
        src={selectedProject?.data.imageSrc || "/projects/fallback.png"} 
        alt={selectedProject?.data.title}
        class="w-full h-64 object-cover brightness-20"
      />
      
      <button 
        class="absolute top-4 right-4 cursor-pointer text-text-100/80 hover:text-text-100 transition-colors"
        on:click={closeModal}
        aria-label="Close Modal"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="size-6 stroke-[1.5]">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>        
      </button>

      <div class="absolute bottom-4 left-4 text-white space-y-2">
        <div>
          <p class="text-lg opacity-50">{selectedProject?.data.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long'})}</p>
          <h2 class="text-6xl font-bold">{selectedProject?.data.title}</h2>
        </div>
        <div class="flex gap-4">
          {#if selectedProject?.data.sourceUrl}
            <a 
              href={selectedProject?.data.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-text-100/80 hover:text-text-100 transition-colors"
              aria-label="View Source Code"
            >  
              <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" fill="currentColor" stroke="currentColor" class="size-6">
                <g><path fill-rule="evenodd" clip-rule="evenodd" d="M64 5.103c-33.347 0-60.388 27.035-60.388 60.388 0 26.682 17.303 49.317 41.297 57.303 3.017.56 4.125-1.31 4.125-2.905 0-1.44-.056-6.197-.082-11.243-16.8 3.653-20.345-7.125-20.345-7.125-2.747-6.98-6.705-8.836-6.705-8.836-5.48-3.748.413-3.67.413-3.67 6.063.425 9.257 6.223 9.257 6.223 5.386 9.23 14.127 6.562 17.573 5.02.542-3.903 2.107-6.568 3.834-8.076-13.413-1.525-27.514-6.704-27.514-29.843 0-6.593 2.36-11.98 6.223-16.21-.628-1.52-2.695-7.662.584-15.98 0 0 5.07-1.623 16.61 6.19C53.7 35 58.867 34.327 64 34.304c5.13.023 10.3.694 15.127 2.033 11.526-7.813 16.59-6.19 16.59-6.19 3.287 8.317 1.22 14.46.593 15.98 3.872 4.23 6.215 9.617 6.215 16.21 0 23.194-14.127 28.3-27.574 29.796 2.167 1.874 4.097 5.55 4.097 11.183 0 8.08-.07 14.583-.07 16.572 0 1.607 1.088 3.49 4.148 2.897 23.98-7.994 41.263-30.622 41.263-57.294C124.388 32.14 97.35 5.104 64 5.104z"></path><path d="M26.484 91.806c-.133.3-.605.39-1.035.185-.44-.196-.685-.605-.543-.906.13-.31.603-.395 1.04-.188.44.197.69.61.537.91zm2.446 2.729c-.287.267-.85.143-1.232-.28-.396-.42-.47-.983-.177-1.254.298-.266.844-.14 1.24.28.394.426.472.984.17 1.255zM31.312 98.012c-.37.258-.976.017-1.35-.52-.37-.538-.37-1.183.01-1.44.373-.258.97-.025 1.35.507.368.545.368 1.19-.01 1.452zm3.261 3.361c-.33.365-1.036.267-1.552-.23-.527-.487-.674-1.18-.343-1.544.336-.366 1.045-.264 1.564.23.527.486.686 1.18.333 1.543zm4.5 1.951c-.147.473-.825.688-1.51.486-.683-.207-1.13-.76-.99-1.238.14-.477.823-.7 1.512-.485.683.206 1.13.756.988 1.237zm4.943.361c.017.498-.563.91-1.28.92-.723.017-1.308-.387-1.315-.877 0-.503.568-.91 1.29-.924.717-.013 1.306.387 1.306.88zm4.598-.782c.086.485-.413.984-1.126 1.117-.7.13-1.35-.172-1.44-.653-.086-.498.422-.997 1.122-1.126.714-.123 1.354.17 1.444.663zm0 0"></path></g>
              </svg>
            </a>
          {/if}
          {#if selectedProject?.data.deploymentUrl}
            <a 
              href={selectedProject?.data.deploymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="text-text-100/80 hover:text-text-100 transition-colors"
              aria-label="View Live"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="size-6 stroke-[1.5]">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
            </a>
          {/if}
        </div>
      </div>
    </div>

    <div class="p-6 space-y-6">
      <p class="text-text-100 max-h-48 overflow-y-scroll">{selectedProject?.data.description || "No description available"}</p>
      <hr class="w-48 h-1 mx-auto bg-text-100/80 border-0 rounded-sm">
      <div class="flex flex-wrap gap-4">
        {#if selectedProject?.data.tags}
          {#each selectedProject.data.tags.sort(sortBySortOrder) as tag}
            <div class="flex items-center gap-2">
              <span class="size-6">
                {@html cachedSvgs[tag.data.svgSrc] || cachedSvgs['/tags/default.svg']}
              </span>
              <p>
                {tag.data.name}
              </p>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </dialog>
</div> 