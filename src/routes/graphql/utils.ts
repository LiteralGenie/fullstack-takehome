import type { UserType, Page } from 'lib/types';

type SearchOptions = {
	first: number;
	after: string;
};

/**
 * Return a subset of users
 * User id is used as cursor
 * The user list should be append-only and not allow deletions, otherwise old cursors become invalid
 * @param users users sorted by id in ascending order
 * @param opts.first number of users to return
 * @param opts.after the first user returned is *after* this cursor
 */
export function searchUsers(users: UserType[], { first, after }: SearchOptions): Page<UserType> {
	const cursorIndex = after ? decodeCursor(after) : 0;

	const usersAfter = users.slice(cursorIndex + 1);
	const firstUsersAfter = usersAfter.slice(0, first);
	const edges = firstUsersAfter.map((node) => {
		const cursor = encodeCursor(node.id);
		return { node, cursor };
	});

	const lastEdge = edges[edges.length - 1];
	const hasNextPage = lastEdge?.node.id === users[users.length - 1].id;
	const endCursor = lastEdge ? lastEdge.cursor : null;
	const pageInfo = { hasNextPage, endCursor };

	const result = { edges, pageInfo };
	return result;
}

function decodeCursor(cursor: string): number {
	const text = Buffer.from(cursor, 'base64').toString('ascii');

	// Extract and validate id
	const idStr = text.match(/^user_(\d+)/)?.at(1);
	if (!idStr) {
		console.error('Invalid cursor', text);
		throw Error('Invalid cursor');
	}

	const id = parseInt(idStr);
	return id;
}

function encodeCursor(id: number): string {
	const text = `user_${id}`;
	const cursor = Buffer.from(text).toString('base64');
	return cursor;
}
