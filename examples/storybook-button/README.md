# Storybook translation fixture

A minimal React CSF3 input for Compify's zero-account inspect/export path. It is
source-only and does not need to be installed or executed.

From the repository root, after building `packages/cli`:

```bash
bun packages/cli/dist/index.js storybook inspect \
  src/Button.stories.tsx --cwd examples/storybook-button
bun packages/cli/dist/index.js storybook export \
  src/Button.stories.tsx --story Primary --cwd examples/storybook-button \
  --output .compify/button.registry.json
```

Review `.compify/button.registry.json`; do not treat schema-valid output as proof
of visual or behavioral equivalence in a consumer application.
