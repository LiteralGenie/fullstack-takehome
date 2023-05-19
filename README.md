# Description

Preview of changes: https://github.com/Linguistic/fullstack-takehome/compare/main...LiteralGenie:fullstack-takehome:main

Pagination logic follows the GraphQL Cursor Connections Specification
https://relay.dev/graphql/connections.htm#sec-Pagination-algorithm
This approach was chosen over something like offset-based / other cursor-based approaches since it seemed popular in the GraphQL community.
(Evidenced by how the urql / Yoga / official GraphQL docs all mention this spec.)

The cursors are derived from the user id, specifically by converting `user_${id}` to base64since specification recommends "opaque strings" for cursors.
These cursors should've probably been cached instead of regenerated on every request but I figured that would be a bit overkill.

> How might you implement a search feature?

After defining the filters as function arguments in the GraphQL schema, I would probably first filter the results by the start / end ids (before / after cursors) then further filter that set by the search query, with whatever limit on the number of results per page.

# Running

- `npm run dev` to launch the app
- `npm run test` to run end-to-end tests
- `npm run tets:unit` to run unit tests
