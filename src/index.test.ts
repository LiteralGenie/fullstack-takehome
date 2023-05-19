import type { UserType } from 'lib/types';
import { describe, it, expect, beforeEach } from 'vitest';
import { searchUsers, type SearchOptions } from './routes/graphql/searchUser';

describe('pagination', () => {
	let users: UserType[];

	beforeEach(() => {
		// Users with ids starting at 1
		users = [...Array(11).keys()].slice(1).map((id) => ({
			id: id,
			name: `name_${id}`,
			email: `${id}@email.com`,
			avatar: `avatar_${id}`
		}));
	});

	it('should handle forward args', () => {
		const cases: Array<{ args: SearchOptions; expectation: number[] }> = [
			// Cases for invalid cursor
			{ args: { first: 2, after: btoa('fds') }, expectation: [1, 2] },
			{ args: { first: 10, after: btoa('fds') }, expectation: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
			{
				args: { first: 1000, after: btoa('fds') },
				expectation: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			},
			// Cases for valid cursor
			{ args: { first: 2, after: btoa('user_1') }, expectation: [2, 3] },
			{ args: { first: 10, after: btoa('user_1') }, expectation: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
			{
				args: { first: 1000, after: btoa('user_1') },
				expectation: [2, 3, 4, 5, 6, 7, 8, 9, 10]
			},
			{ args: { first: 2, after: btoa('user_10') }, expectation: [] }
		];

		for (let c of cases) {
			const result = searchUsers(users, c.args);
			const ids = result.edges.map((e) => e.node.id);
			expect(ids).toEqual(c.expectation);
		}
	});

	it('should handle backward args', () => {
		const cases: Array<{ args: SearchOptions; expectation: number[] }> = [
			// Cases for invalid cursor
			{ args: { last: 2, before: btoa('fds') }, expectation: [9, 10] },
			{ args: { last: 10, before: btoa('fds') }, expectation: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
			{
				args: { last: 1000, before: btoa('fds') },
				expectation: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
			},
			// Cases for valid cursor
			{ args: { last: 2, before: btoa('user_10') }, expectation: [8, 9] },
			{ args: { last: 10, before: btoa('user_10') }, expectation: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
			{
				args: { last: 1000, before: btoa('user_10') },
				expectation: [1, 2, 3, 4, 5, 6, 7, 8, 9]
			},
			{ args: { last: 2, before: btoa('user_1') }, expectation: [] }
		];

		for (let c of cases) {
			const result = searchUsers(users, c.args);
			const ids = result.edges.map((e) => e.node.id);
			expect(ids).toEqual(c.expectation);
		}
	});

	it('should throw on missing args', () => {
		const base = { first: 10, after: '', last: 100, before: '' } as const;
		type Key = 'first' | 'after' | 'last' | 'before';

		// Clone base, ignoring all keys but those in ks
		function withKeys(ks: Key[]): SearchOptions {
			const result = { ...base };
			for (let prop in result) {
				const k = prop as Key;
				if (!ks.includes(k)) {
					delete result[k];
				}
			}
			return result;
		}

		const cases: SearchOptions[] = [
			// 1 valid pair
			withKeys(['first']),
			withKeys(['after']),
			withKeys(['last']),
			withKeys(['before']),
			// 2 valid pairs
			withKeys(['first', 'last']),
			withKeys(['first', 'before']),
			withKeys(['after', 'last']),
			withKeys(['after', 'before']),
			// 1 valid pair, 1 valid pair
			withKeys(['first', 'last', 'before']),
			withKeys(['after', 'last', 'before']),
			withKeys(['last', 'first', 'after']),
			withKeys(['before', 'first', 'after'])
		];

		for (let c of cases) {
			expect(() => searchUsers(users, c)).toThrowError();
		}
	});

	it('should throw on negative item counts', () => {
		const cases: SearchOptions[] = [
			{ first: -1, after: '' },
			{ last: -1, before: '' }
		];

		for (let c of cases) {
			expect(() => searchUsers(users, c)).toThrowError();
		}
	});
});
