---
name: OpenAPI zod codegen gotchas
description: Two orval/zod codegen pitfalls that break the build after adding fields to openapi.yaml or generated react-query hooks.
---

- Do not use `format: email` on string properties in `openapi.yaml`. The workspace's pinned zod version does not expose the top-level format helper orval emits for it, so codegen's own `typecheck:libs` step fails with `Property 'email' does not exist on type ... zod`. Use a plain `type: string` (with `minLength` if useful) and validate email format in the route handler instead.
- Generated react-query hooks (`useXxx(..., { query: { enabled: ... } })`) require an explicit `queryKey` (e.g. `getXxxQueryKey(...)`) whenever `enabled` is passed — passing `enabled` alone fails typecheck because `queryKey` is otherwise required by the inferred options type.
