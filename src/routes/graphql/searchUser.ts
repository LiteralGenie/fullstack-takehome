import type { UserType, Page } from 'lib/types';
import { isEmptyArray } from 'lib/utils';

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
 * User id is used as cursor, ids should be sequential (1,2,3,...)
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
		const index = id - 1;
		if (index >= 0 && index < users.length) {
			indexAfter = index;
		}
	}

	let indexBefore = users.length;
	if (backwardArgs) {
		const id = decodeCursor(backwardArgs.before);
		const index = id - 1;
		if (index >= 0 && index < users.length) {
			indexAfter = index;
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
	const hasNextPage = idxEnd < users.length;
	const hasPreviousPage = idxStart > 0;
	if (isEmptyArray(edges)) {
		const pageInfo = {
			hasNextPage: hasNextPage,
			endCursor: null,
			hasPreviousPage: hasPreviousPage,
			startCursor: null
		};
		return { edges: edges as [], pageInfo };
	} else {
		const pageInfo = {
			hasNextPage: hasNextPage,
			endCursor: edges[edges.length - 1].cursor,
			hasPreviousPage: hasPreviousPage,
			startCursor: edges[0].cursor
		};
		return { edges, pageInfo };
	}
}

/**
 * Extract id from base64 string
 * @param cursor
 * @returns NaN if invalid, otherwise an integer
 */
function decodeCursor(cursor: string): number {
	const text = Buffer.from(cursor, 'base64').toString('ascii');

	// Extract and validate id
	const idStr = text.match(/^user_(\d+)/)?.at(1);
	if (!idStr) {
		return NaN;
	}

	const id = parseInt(idStr);
	return id;
}

/**
 * Convert id to base64
 * @param id
 */
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
