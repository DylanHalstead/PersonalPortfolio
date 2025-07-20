<!-- 
  @component
  
  A Svelte component that generates a scrollable list (via overflow-x-scroll) with a fade effect on the left and right sides.
  
  @prop {string} gap - The gap between the items in the list.
  @prop {string} fadeWidth - The width of the fade effect.
  @prop {string} fadeColor - The color of the fade effect.
  @prop {number} fadeDuration - The duration of the fade effect.

  @example
  ```astro
  <ScrollableList client:only="svelte" />
  ```
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';

  export let fadeWidth = 'w-12';
  export let fadeColor = 'from-background-950';
  export let fadeDuration = 200;

  let listWrapper: HTMLDivElement;
  let showLeftFade = false;
  let showRightFade = true;
  let ticking = false;

  function updateFadeState() {
    if (!listWrapper || ticking) return;
    
    ticking = true;
    requestAnimationFrame(() => {
      const { scrollLeft, scrollWidth, clientWidth } = listWrapper;
      showLeftFade = scrollLeft > 0;
      showRightFade = scrollLeft < scrollWidth - clientWidth - 1;
      ticking = false;
    });
  }

  onMount(() => {
    if (listWrapper) {
      updateFadeState();
      // Use ResizeObserver to handle container size changes
      const resizeObserver = new ResizeObserver(() => {
        updateFadeState();
      });
      resizeObserver.observe(listWrapper);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  });
</script>

<div class="relative">
  <div 
    class="overflow-x-scroll scrollbar-none will-change-scroll"
    bind:this={listWrapper}
    on:scroll={updateFadeState}
  >
    <slot />
  </div>
  
  {#if showLeftFade}
    <div 
      class="absolute left-0 top-0 bottom-0 {fadeWidth} bg-gradient-to-r {fadeColor} to-transparent pointer-events-none will-change-opacity"
      in:fade={{ duration: fadeDuration }}
      out:fade={{ duration: fadeDuration }}
    ></div>
  {/if}
  
  {#if showRightFade}
    <div 
      class="absolute right-0 top-0 bottom-0 {fadeWidth} bg-gradient-to-l {fadeColor} to-transparent pointer-events-none will-change-opacity"
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 200 }}
    ></div>
  {/if}
</div>

<style>
  .will-change-scroll {
    will-change: scroll-position;
  }
  .will-change-opacity {
    will-change: opacity;
  }
</style>