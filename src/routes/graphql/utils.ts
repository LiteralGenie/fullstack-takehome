import type { UserType, Page } from 'lib/types';

type ForwardArguments = {
	first: number;
	after: string;
};

type BackwardArguments = {
	last: number;
	before: string;
};

type SearchOptions = Partial<ForwardArguments> & Partial<BackwardArguments>;

/**
 * Return a subset of users
 * User id is used as cursor (not the index!)
 * The user list should be append-only and not allow deletions, otherwise old cursors become invalid
 * This is an implementation of https://relay.dev/graphql/connections.htm#sec-Pagination-algorithm
 * @param users users sorted by id in ascending order
 * @param opts.after the first user returned is *after* this cursor
 * @param opts.first number of users to return that follow opts.after
 * @param opts.after the last user returned is *before* this cursor
 * @param opts.last number of users to return that precede opts.after
 */
export function searchUsers(users: UserType[], opts: SearchOptions): Page<UserType> {
	// Assert that {first, after} and / or {last, before exist}
	const [forwardArgs, backwardArgs] = validateSearchOptions(opts);

	// Convert cursors to indices
	let indexAfter = -1;
	if (forwardArgs) {
		const id = decodeCursor(forwardArgs.after);
		if (!isNaN(id)) {
			indexAfter = users.findIndex((user) => user.id === id) ?? indexAfter;
		}
	}

	let indexBefore = users.length;
	if (backwardArgs) {
		const id = decodeCursor(backwardArgs.before);
		if (!isNaN(id)) {
			indexBefore = users.findIndex((user) => user.id === id) ?? indexBefore;
		}
	}

	// Get all users between indices (after, before), accounting for first and last
	// Note that the resulting range [start, end) may be invalid (ie start >= end)
	let [idxStart, idxEnd] = [indexAfter + 1, indexBefore];
	if (forwardArgs) {
		idxEnd = idxStart + forwardArgs.first;
	}
	if (backwardArgs) {
		idxStart = idxEnd - backwardArgs.last;
	}
	const usersSlice = users.slice(idxStart, idxEnd);

	// Convert users to edges
	const edges = usersSlice.map((node) => {
		const cursor = encodeCursor(node.id);
		return { node, cursor };
	});

	// Create pageInfo
	const pageInfo: Page['pageInfo'] = {
		hasNextPage: idxEnd < users.length,
		endCursor: edges[edges.length - 1]?.cursor || null,
		hasPreviousPage: idxStart > 0,
		startCursor: edges[0]?.cursor || null
	};

	const result = { edges, pageInfo };
	return result;
}

function decodeCursor(cursor: string): number {
	const text = Buffer.from(cursor, 'base64').toString('ascii');

	// Extract and validate id
	const idStr = text.match(/^user_(\d+)/)?.at(1);
	if (!idStr) {
		console.warn('Invalid cursor', text);
		return NaN;
	}

	const id = parseInt(idStr);
	return id;
}

function encodeCursor(id: number): string {
	const text = `user_${id}`;
	const cursor = Buffer.from(text).toString('base64');
	return cursor;
}

function validateSearchOptions({
	first,
	after,
	last,
	before
}: SearchOptions): [ForwardArguments | null, BackwardArguments | null] {
	// Validate that at least one pair is defined
	const hasForwardArgs = isDefined(first) && isDefined(after);
	const hasBackwardArgs = isDefined(last) && isDefined(before);
	if (!hasForwardArgs && !hasBackwardArgs) {
		throw Error('Either first and after must be specified or before and last.');
	}

	// Validate individual pairs
	if (!isBothDefinedOrUndefined(first, after)) {
		throw Error('Cannot specify first without after and vice-versa.');
	}
	if (!isBothDefinedOrUndefined(last, before)) {
		throw Error('Cannot specify after without first and vice-versa.');
	}

	// Validate first / last are non-negative
	if (hasForwardArgs && first < 0) {
		throw Error('first cannot be negative');
	}
	if (hasBackwardArgs && last < 0) {
		throw Error('last cannot be negative');
	}

	const forwardArgs = hasForwardArgs ? { first, after } : null;
	const backwardArgs = hasBackwardArgs ? { last, before } : null;
	return [forwardArgs, backwardArgs];

	function isBothDefinedOrUndefined(left: any, right: any): boolean {
		return isDefined(left) === isDefined(right);
	}
}

function isDefined<T = any>(x: T | null | undefined): x is T {
	return x !== null && x !== undefined;
}
