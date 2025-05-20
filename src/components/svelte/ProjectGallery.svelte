<script lang="ts">
  import type { CollectionEntry } from 'astro:content';

  const PROJECTS_PER_PAGE = 6;
  
  export let projects: CollectionEntry<'projects'>[];
  export let tags: CollectionEntry<'tags'>[];
  
  let dialog: HTMLDialogElement;
  
  // Resolve tag references to get full tag data
  // TODO: verify this is needed
  $: resolvedProjects = projects.map(project => ({
    ...project,
    data: {
      ...project.data,
      tags: project.data.tags
        .map(tagRef => tags.find(t => t.id === tagRef.id))
        .filter((tag) => tag !== undefined)
    }
  }));
  
  let currentPage = 1;
  let selectedTags: string[] = [];
  let selectedProject: CollectionEntry<'projects'> | null = null;
  
  $: sortedTags = [...tags].sort((a, b) => a.data.sortOrder - b.data.sortOrder);
  $: sortedProjects = [...resolvedProjects].sort((a, b) => a.data.sortOrder - b.data.sortOrder);
  
  $: filteredProjects = selectedTags.length === 0
    ? sortedProjects
    : [...sortedProjects].sort((a, b) => {
        const aMatches = a.data.tags.filter(tag => selectedTags.includes(tag.id)).length;
        const bMatches = b.data.tags.filter(tag => selectedTags.includes(tag.id)).length;
        // Order by number of matches, then by sortOrder
        const aScore = aMatches + (1 / (a.data.sortOrder + 1));
        const bScore = bMatches + (1 / (b.data.sortOrder + 1));
        return bScore - aScore;
      });
  
  $: totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);
  $: paginatedProjects = filteredProjects.slice(
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
  
  function openModal(project: CollectionEntry<'projects'>) {
    selectedProject = project;
    dialog?.showModal();
  }
  
  function closeModal() {
    selectedProject = null;
    dialog?.close();
  }
</script>

<div class="container mx-auto px-4 py-8">
  <div class="mb-8">
    <h2 class="text-2xl font-bold mb-4">Filter by Tags</h2>
    <ul class="flex flex-wrap gap-2">
      {#each sortedTags as tag}
        <li>
          <button
            class="px-4 py-2 rounded-full transition-colors duration-200 {selectedTags.includes(tag.id) 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'}"
            on:click={() => toggleTag(tag.id)}
          >
            <span class="inline-block mr-2">{@html tag.data.svgSrc}</span>
            {tag.data.name}
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each paginatedProjects as project}
      <div class="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-200 hover:scale-105">
        <!-- TODO: verify this lazy is needed/wanted -->
        <img 
          src={project.data.imageSrc} 
          alt={project.data.title}
          class="w-full h-48 object-cover"
          loading="lazy"
        />
        <div class="p-4">
          <h3 class="text-xl font-semibold mb-2">{project.data.title}</h3>
          <p class="text-gray-600 mb-4 line-clamp-2">{project.data.description}</p>
          <div class="flex gap-2 mb-4">
            {#each project.data.tags as tag}
              <span class="inline-block">{@html tag.data.svgSrc}</span>
            {/each}
          </div>
          <button
            class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            on:click={() => openModal(project)}
          >
            View Details
          </button>
        </div>
      </div>
    {/each}
  </div>

  {#if totalPages > 1}
    <div class="flex justify-center gap-2 mt-8">
      {#each Array(totalPages) as _, i}
        <button
          class="px-4 py-2 rounded {currentPage === i + 1 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 hover:bg-gray-300'}"
          on:click={() => currentPage = i + 1}
        >
          {i + 1}
        </button>
      {/each}
    </div>
  {/if}

  {#if selectedProject}
    <dialog
      bind:this={dialog}
      class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0 backdrop:bg-black/50"
      on:click|stopPropagation
    >
      <div class="p-6">
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-2xl font-bold">{selectedProject.data.title}</h2>
          <button 
            class="text-gray-500 hover:text-gray-700"
            on:click={closeModal}
          >
            ✕
          </button>
        </div>
        <img 
          src={selectedProject.data.imageSrc} 
          alt={selectedProject.data.title}
          class="w-full h-64 object-cover rounded-lg mb-4"
        />
        <p class="text-gray-600 mb-4">{selectedProject.data.description}</p>
        <div class="flex gap-4">
          <a 
            href={selectedProject.data.deploymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            View Live
          </a>
          <a 
            href={selectedProject.data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Source Code
          </a>
        </div>
      </div>
    </dialog>
  {/if}
</div> 