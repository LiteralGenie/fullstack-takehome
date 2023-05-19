<script lang="ts">
	import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType, Page } from 'lib/types';
	import { createEventDispatcher, onMount } from 'svelte';

	const client = createClient({
		url: '/graphql',
		exchanges: [cacheExchange, fetchExchange]
	});

	export let after: string;
	export let first: number;

	const result = queryStore<{ searchUsers: Page<UserType> }>({
		client,
		query: gql`
			query SearchUsers($first: Int!, $after: String!) {
				searchUsers(first: $first, after: $after) {
					edges {
						cursor
						node {
							id
							name
							avatar
							email
						}
					}
					pageInfo {
						hasPreviousPage
						hasNextPage
						startCursor
						endCursor
					}
				}
			}
		`,
		variables: { after, first }
	});

	const dispatch = createEventDispatcher<{ searchresult: Page<UserType> }>();

	onMount(() =>
		result.subscribe((value) => {
			if (!value.fetching && value.data) {
				dispatch('searchresult', value.data.searchUsers);
			}
		})
	);
</script>

<div class="flex flex-col gap-4 items-center pb-4">
	{#if $result.fetching}
		<div class="py-8">
			<Loader />
		</div>
	{:else if $result.data?.searchUsers}
		{#each $result.data?.searchUsers.edges as user (user.node.id)}
			<User user={user.node} />
		{/each}
	{/if}
</div>
