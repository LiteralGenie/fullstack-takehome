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

	type PageStatus = {
		// Whether the previous page was loaded, null if not
		cursor: string | null;
		// Whether this page has been scrolled into view
		// (starts false and only updated to true if cursor is non-null)
		pageWasVisible: boolean;
	};
	const defaultPageStatus = { cursor: null, pageWasVisible: false } as const satisfies PageStatus;
	let pageStatuses: PageStatus[] = [{ cursor: '', pageWasVisible: true }];

	// Whether there's still pages to show
	let hasNextPage = true;

	// The scrollable list of pages
	let containerEl: HTMLDivElement;

	// When this is visible, load a new page
	let trailerEl: HTMLDivElement;

	// When a page load, use its last cursor to fetch the next page
	function onPageLoad({ detail }: CustomEvent<Page<UserType>>, pageIdx: number) {
		console.log(`Page ${pageIdx} loaded`);

		const nextPageStatus = getPageStatus(pageIdx + 1);

		// If there's no data and this isn't the first page, something went horribly wrong
		if (isEmptyArray(detail.edges) && pageIdx > 0) {
			console.error('No data loaded', detail);
			hasNextPage = false;
			return;
		}

		// Grab cursor for the next page
		if (detail.pageInfo.hasNextPage) {
			nextPageStatus.cursor = detail.pageInfo.endCursor as string;
			console.log(`Set cursor of page ${pageIdx + 1} to ${nextPageStatus.cursor}`);
		} else {
			console.log('No more data.');
			hasNextPage = false;
		}
	}

	// Get item at certain index, appending new items if necessary
	function getPageStatus(idx: number): PageStatus {
		while (pageStatuses.length <= idx) {
			pageStatuses.push({ ...defaultPageStatus });
			pageStatuses = pageStatuses;
		}

		return pageStatuses[idx];
	}

	// Check if we need to load more pages
	function checkTrailerVisibility() {
		if (!hasNextPage) {
			return;
		}
		if (!containerEl || !trailerEl) {
			return;
		}

		// If the bottom of the list is in view, mark all loaded pages as seen
		const bottomOfPage = containerEl.offsetTop + containerEl.scrollTop + document.body.clientHeight;
		const topOfTrailer = trailerEl.offsetTop;
		const trailerIsVisible = topOfTrailer < bottomOfPage;
		if (trailerIsVisible) {
			for (let i = pageStatuses.length - 1; i >= 0; i--) {
				const status = pageStatuses[i];

				// Ignore pages that aren't loaded / loading
				if (!status.cursor) {
					continue;
				}

				if (!status.pageWasVisible) {
					status.pageWasVisible = true;
					pageStatuses = pageStatuses;
					console.log(`Loading of page ${i} enabled.`);
				} else {
					// We can assume all remaining pages were already marked as viewed
					break;
				}
			}
		}
	}
	// Run the check after each page loads (pageCursors is appended to)
	$: pageStatuses, checkTrailerVisibility();
</script>

<svelte:window on:resize={() => checkTrailerVisibility()} />

<div
	bind:this={containerEl}
	on:scroll={() => checkTrailerVisibility()}
	class="w-full h-full overflow-scroll"
>
	{#each pageStatuses as page, pageIdx}
		{#if page.cursor !== null && page.pageWasVisible}
			<UserList
				after={page.cursor}
				first={pageSize}
				on:searchresult={(data) => onPageLoad(data, pageIdx)}
			/>
		{/if}
	{/each}
	<div bind:this={trailerEl} style="margin-top: -3vh; height:3vh; pointer-events: none;" />
</div>
