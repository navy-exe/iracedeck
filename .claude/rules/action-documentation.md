---
paths:
  - docs/plugins/**/actions/**
# Action Documentation Standards

## Document Structure

Action documentation follows this section order:

1. **Title** (H1) - Action name
2. **Description** - One-line description of what the action does
3. **Properties** - Table with Action ID, Type, SDK Support, Encoder Support
4. **Behavior** - Button Press and Encoder subsections (if applicable)
5. **Settings** - Configuration options table + option lists as bullet points
6. **Keyboard Simulation** - Keys sent and iRacing setting names
7. **Icon States** - Visual states table
8. **Telemetry Integration** - (if applicable)
9. **Notes** - Additional context, limitations, tips

## Properties Table

```markdown
| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.{plugin}.{action-name}` |
| Type | Button / Toggle / +/- / Multi-toggle |
| SDK Support | Yes / No |
| Encoder Support | Yes / No |
```

## Settings Section

Use a table for settings overview, then **bullet point lists** for options (never inline backtick lists like `` `A` or `B` ``):

```markdown
| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Mode | Dropdown | Direct | Selection mode |

### Mode Options
- **Direct** - Opens a specific item immediately
- **Next** - Cycles to the next item
- **Previous** - Cycles to the previous item
```

For actions with no settings, use:
```markdown
## Settings

None.
```

## Keyboard Simulation Table

**IMPORTANT**: Always use "Default Key" (not just "Key") as the column header.

```markdown
| Action | Default Key | iRacing Setting |
|--------|-------------|-----------------|
| Increase | ] | Increase Setting Name |
```

- Use `*(none)*` for actions without a default iRacing keybind

## Icon States

- Icons for related actions must be visually distinguishable from similar icons elsewhere
- Use labels/badges (e.g., "BB" for black box) to differentiate action categories
- Describe icons clearly so designers can implement consistently

```markdown
All icons include a small "XX" label to distinguish them from similar icons.

| Mode/State | Icon |
|------------|------|
| Default | Description + label |
```

## Reference Template

See `docs/plugins/core/actions/black-box-selector.md` as the canonical example.
