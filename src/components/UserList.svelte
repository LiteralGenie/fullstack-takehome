<script lang="ts">
	import { cacheExchange, createClient, fetchExchange, gql, queryStore } from '@urql/svelte';
	import Loader from 'components/Loader.svelte';
	import User from 'components/User.svelte';
	import type { UserType, Page } from 'lib/types';

	const client = createClient({
		url: '/graphql',
		exchanges: [cacheExchange, fetchExchange]
	});

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
				}
			}
		`,
		variables: { first: 10, after: '' }
	});

	$: console.log('got', $result.data);
</script>

<div class="flex flex-col gap-4 items-center p-4">
	{#if $result.fetching}
		<Loader />
	{:else if $result.data?.searchUsers}
		{#each $result.data?.searchUsers.edges as user (user.node.id)}
			<User user={user.node} />
		{/each}
	{/if}
</div>
