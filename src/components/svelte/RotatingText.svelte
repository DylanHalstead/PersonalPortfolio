<!-- 
  @component
  
  A Svelte component that generates a rotating text effect, with the ability to add before and after text.

  @prop {string[]} rotatingText - The pieces of text that will rotate
  @prop {boolean} infinite - Whether to rotate infinitely
  @prop {number} textTransitionDelay - The delay between swapping options

  @example
  ```astro
  <RotatingText client:only="svelte" options={['awesome', 'cool', 'dope']} infinite={true} >
    <span slot="before">This is the before something</span>
    <span slot="after">!</span>
  </RotatingText>
  ```
-->
<script lang="ts">
import { onMount } from "svelte";

export let rotatingText: string[];
export const infinite: boolean = false;
export const textTransitionDelay: number = 3000;

let currentIndex = 0;
let currentText = rotatingText[0];
let isAnimating = false;
const container: HTMLElement | null = null;
let isVisible = false;
let interval: ReturnType<typeof setInterval> | null = null;
const textElement: HTMLElement | null = null;
const hiddenMeasureElement: HTMLElement | null = null;
let rafId: number | null = null; // Store RAF ID for cleanup

/**
 * Measures the width needed for a given text by putting in a hidden element
 * @param text - The text to measure
 */
function measureWidth(text: string): number {
	if (!hiddenMeasureElement || !isVisible) return 0;
	hiddenMeasureElement.textContent = text;
	return hiddenMeasureElement.offsetWidth;
}

/**
 * Updates the width of the rotating text element based on current content
 */
function updateTextWidth() {
	if (textElement && isVisible) {
		const width = measureWidth(currentText);
		if (width > 0) {
			textElement.style.width = `${width}px`;
		}
	}
}

function handleResize() {
	if (rafId !== null) {
		cancelAnimationFrame(rafId);
	}
	rafId = requestAnimationFrame(() => {
		if (isVisible) {
			updateTextWidth();
		}
		rafId = null;
	});
}

/**
 * Rotates the text by animating the entire phrase
 */
function rotateText() {
	// Only animate if the component is visible and not already animating
	if (isAnimating || !isVisible || !textElement) return;
	isAnimating = true;

	// Queue next option and stop if we've completed a full rotation
	const nextIndex = (currentIndex + 1) % rotatingText.length;
	if (nextIndex === 0 && !infinite) {
		if (interval) clearInterval(interval);
		return;
	}

	const nextText = rotatingText[nextIndex];
	const nextWidth = measureWidth(nextText);
	if (nextWidth === 0) return; // Skip animation if measurement failed

	// First animation: move text up and fade out
	textElement.classList.add("translate-y-[-100%]", "opacity-0");

	// After text starts fading out, begin width transition
	const widthTransitionDelay = 150;
	setTimeout(() => {
		if (!textElement) return;
		textElement.style.width = `${nextWidth}px`;
	}, widthTransitionDelay);

	// After first animation, update text and start second animation
	const textTransitionDelay = 300;
	setTimeout(() => {
		if (!textElement) return;
		textElement.textContent = nextText;
		textElement.classList.remove("translate-y-[-100%]", "opacity-0");
		textElement.classList.add("translate-y-[100%]", "opacity-0");

		// Final animation: move text to original position and fade in
		setTimeout(() => {
			if (!textElement) return;
			textElement.classList.remove("translate-y-[100%]", "opacity-0");

			// Remove transition after animation completes
			setTimeout(() => {
				if (!textElement) return;
			}, 300); // Wait for the animation to complete

			currentIndex = nextIndex;
			currentText = nextText;
			isAnimating = false;
		}, textTransitionDelay);
	}, textTransitionDelay);
}

onMount(() => {
	// Set initial width if visible
	if (isVisible) {
		updateTextWidth();
	}

	// Add resize event listener using RAF
	window.addEventListener("resize", handleResize, { passive: true });

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				const wasVisible = isVisible;
				isVisible = entry.isIntersecting;

				// Start animation interval when component becomes visible
				if (isVisible) {
					if (!wasVisible) {
						updateTextWidth(); // Update width when becoming visible
					}
					if (!interval) {
						interval = setInterval(rotateText, textTransitionDelay);
					}
				} else if (interval) {
					clearInterval(interval);
					interval = null;
				}
			});
		},
		{ threshold: 0.5 },
	);

	if (container) {
		observer.observe(container);
	}

	return () => {
		if (interval) clearInterval(interval);
		if (rafId !== null) cancelAnimationFrame(rafId);
		if (container) observer.unobserve(container);
		window.removeEventListener("resize", handleResize);
	};
});
</script>

<div 
  bind:this={container}
  class="flex flex-wrap justify-center gap-2 lg:gap-3 cursor-text"
>
  <!-- Hidden element for measuring text width -->
  <span
    bind:this={hiddenMeasureElement}
    class="absolute invisible"
    aria-hidden="true"
  >
    {currentText}
  </span>

  <slot name="before"></slot>
  
  <span
    bind:this={textElement}
    class="inline-block text-nowrap -z-10 transition-all duration-300 ease-in-out"
  >
    {currentText}
  </span>

  <slot name="after"></slot>
</div> 