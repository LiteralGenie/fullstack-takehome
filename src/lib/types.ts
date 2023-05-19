export type UserType = {
	id: number;
	name: string;
	email: string;
	avatar: string;
};

export type Page<T = any> = {
	edges: Array<{
		cursor: string;
		node: T;
	}>;
	pageInfo: {
		hasNextPage: boolean;
		endCursor: string | null;
		hasPreviousPage: boolean;
		startCursor: string | null;
	};
};
