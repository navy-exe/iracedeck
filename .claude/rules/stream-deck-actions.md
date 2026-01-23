---
# Stream Deck Plugins and Actions

## Plugin Package Structure

Each Stream Deck plugin package must have a `.gitignore` file at the package root with:

```gitignore
# Node.js
node_modules/

# Stream Deck files
*.sdPlugin/bin
*.sdPlugin/logs
```

The `bin/` folder contains build output and must not be committed to git.

## Action Locations

- Stream Deck actions live under each plugin: `{package}/src/actions/**`.

Requirements

- All actions must extend `ConnectionStateAwareAction` from `stream-deck-shared`.
- Action settings should use Zod schemas when the action has settings.
- Actions must not implement their own global offline handling; offline behavior is handled centrally.

Directional Actions (increase/decrease, cycle)

- Use a `direction` setting key for directional actions.
- For +/- actions use values like `Increase`/`Decrease` or `Up`/`Down` depending on context.
- For cycle actions use `Next`/`Previous`.

Global Key Bindings

- Global key bindings are stored at the plugin level (Property Inspector) and referenced by actions via identifiers.
- Defaults should match iRacing where applicable.

Property Inspector Components

- Shared PI components are in `packages/stream-deck-shared/src/pi/` and compiled to `dist/pi-components.js`.
- To use components in PI HTML include: `sdpi-components.js` and `pi-components.js`.
- Build PI components:

```bash
cd packages/stream-deck-shared
pnpm build:pi
pnpm build
```
