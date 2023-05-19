export type UserType = {
	id: number;
	name: string;
	email: string;
	avatar: string;
};

export type EmptyPage = {
	edges: [];
	pageInfo: {
		hasNextPage: boolean;
		endCursor: null;
		hasPreviousPage: boolean;
		startCursor: null;
	};
};

export type Page<T = any> =
	| {
			edges: Array<{
				cursor: string;
				node: T;
			}>;
			pageInfo: {
				hasNextPage: boolean;
				endCursor: string;
				hasPreviousPage: boolean;
				startCursor: string;
			};
	  }
	| EmptyPage;
