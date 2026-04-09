---
title: Force Feedback
description: Force feedback and haptic controls
sidebar:
  badge:
    text: "11 modes"
    variant: tip
---

Force Feedback provides control over all force feedback and haptic settings from iRacing's Audio & Force Feedback page.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.force-feedback` |
| Type | Toggle / +/- |
| SDK Support | No |
| Encoder Support | Yes |

## Modes

### Force Feedback

| Mode | Type | Direction | Default Key | iRacing Setting |
|------|------|-----------|-------------|-----------------|
| Auto Compute FFB Force | Toggle | — | `Ctrl+A` | Auto Compute FFB Force |
| FFB Force | +/- | Increase / Decrease | *(none)* | Increase FFB Force / Decrease FFB Force |
| Wheel LFE | +/- | Louder / Quieter | *(none)* | Wheel LFE Louder / Wheel LFE Quieter |

### Bass Shaker

| Mode | Type | Direction | Default Key | iRacing Setting |
|------|------|-----------|-------------|-----------------|
| BassShaker LFE | +/- | Louder / Quieter | *(none)* | BassShaker LFE Louder / BassShaker LFE Quieter |

### Wheel LFE Controls

| Mode | Type | Direction | Default Key | iRacing Setting |
|------|------|-----------|-------------|-----------------|
| Wheel LFE Intensity | +/- | More Intense / Less Intense | *(none)* | Wheel LFE More Intense / Wheel LFE Less Intense |

### Haptic LFE Controls

| Mode | Type | Direction | Default Key | iRacing Setting |
|------|------|-----------|-------------|-----------------|
| Haptic LFE Intensity | +/- | More Intense / Less Intense | *(none)* | Haptic LFE More Intense / Haptic LFE Less Intense |

## Encoder Support

All directional modes support Stream Deck+ encoder rotation:
- **Clockwise** = increase / louder / more intense
- **Counter-clockwise** = decrease / quieter / less intense

Auto Compute FFB Force does **not** support encoder — it is a keypad-only toggle. The dial press is a no-op to prevent accidental toggling.

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Mode | Dropdown | Auto Compute FFB Force | Force feedback control to activate |
| Direction | Dropdown | Increase | Direction for +/- modes (hidden for toggle modes) |

## Notes

- FFB Force increase/decrease shares global key bindings with the Cockpit Misc action for backward compatibility.
- All key bindings default to no key — users must configure them to match their iRacing settings, except Auto Compute FFB Force which defaults to `Ctrl+A`.
