<script lang="ts">
	import { Client, setContextClient, cacheExchange, fetchExchange } from '@urql/svelte';
	import UserList from 'components/UserList.svelte';
	import type { UserType, Page } from 'lib/types';
	import { isEmptyArray } from 'lib/utils';

	const client = new Client({
		url: '/graphql',
		exchanges: [cacheExchange, fetchExchange]
	});

	setContextClient(client);

	// How many users to load at once
	const pageSize = 10;

	// Pointers to top of each page
	let pageCursors = [''];

	// Whether there's still pages to show
	let hasNextPage = true;

	// The scrollable list of pages
	let containerEl: HTMLDivElement;

	// When this is visible, load a new page
	let trailerEl: HTMLDivElement;

	// New pages won't load until user scrolls to bottom and updates this var
	let nextUnseenPage = 0;

	// New pages won't load until the previous page (it's endCursor) is fetched
	function onPageLoad({ detail }: CustomEvent<Page<UserType>>, pageIdx: number) {
		console.log(`Page ${pageIdx} loaded`);

		// If there's no data and this isn't the first page, something went horribly wrong
		if (isEmptyArray(detail.edges) && pageIdx > 0) {
			console.error('No data loaded', detail);
			hasNextPage = false;
			return;
		}

		// Grab cursor for the next page
		if (detail.pageInfo.hasNextPage) {
			const nextPageIdx = pageIdx + 1;
			if (nextPageIdx == pageCursors.length) {
				pageCursors.push(detail.pageInfo.endCursor as string);
				pageCursors = pageCursors;
			} else {
				const adverb = pageCursors.length < nextPageIdx ? 'only' : 'already';
				console.error(`Page ${nextPageIdx} was loaded but there is ${adverb} pages loaded.`);
			}
		} else {
			console.log('No more data.');
			hasNextPage = false;
		}
	}

	// Check if we need to load more pages
	function checkTrailerVisibility(cursors: string[]) {
		if (!hasNextPage) {
			return;
		}
		if (!containerEl || !trailerEl) {
			return;
		}

		const bottomOfPage = containerEl.scrollTop + document.body.clientHeight;
		const topOfTrailer = trailerEl.offsetTop;
		if (topOfTrailer < bottomOfPage) {
			// While hasNextPage is true, the final item in pageCursors is always the next page we need to load
			nextUnseenPage = cursors.length - 1;
			console.log(`Loading of page ${nextUnseenPage} enabled.`);
		}
	}
	// Run the check after each page loads (pageCursors is appended to)
	$: checkTrailerVisibility(pageCursors);
</script>

<div
	bind:this={containerEl}
	on:scroll={() => checkTrailerVisibility(pageCursors)}
	class="w-full h-full overflow-scroll"
>
	{#each pageCursors as cursor, pageIdx}
		{#if pageIdx <= nextUnseenPage}
			<UserList
				after={cursor}
				first={pageSize}
				on:searchresult={(data) => onPageLoad(data, pageIdx)}
			/>
		{/if}
	{/each}
	<div bind:this={trailerEl} style="margin-top: -3vh; height:3vh; pointer-events: none;" />
</div>
