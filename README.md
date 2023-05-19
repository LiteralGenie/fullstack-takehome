# Description

Pagination logic follows the GraphQL Cursor Connections Specification
https://relay.dev/graphql/connections.htm#sec-Pagination-algorithm
This approach was chosen over something like offset-based / other cursor-based approaches since it seemed popular in the GraphQL community.
(Evidenced by how the urql / Yoga / official GraphQL docs all mention this spec.)

The cursors are derived from the user id, specifically by converting `user_${id}` to base64. This is done because the specification recommends "opaque strings" for cursors.
These cursors should've probably been cached instead of regenerated on every request but I figured that would be a bit overkill.
(And the specifics would probably depend on how the data is generated / updated.)

Preview of changes: https://github.com/Linguistic/fullstack-takehome/compare/main...LiteralGenie:fullstack-takehome:main
