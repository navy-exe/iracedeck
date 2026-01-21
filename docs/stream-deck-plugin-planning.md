# Stream Deck Plugin Planning

Based on [iRacing keyboard shortcuts](keyboard-shortcuts.md) and SDK capabilities, organized into plugins with max 32 actions each.

## Plugin 1: `com.iracedeck.sd.core` (Core Plugin)

Core driving, cockpit, and interface controls. Maps to "In Car" section of keyboard shortcuts.

| #   | Action                       | Type         | Notes                                       |
| --- | ---------------------------- | ------------ | ------------------------------------------- |
| 1   | Black Box Selector           | Multi-toggle | F1–F11 + cycle (12 options in one action)   |
| 2   | Splits Delta Cycle           | Multi-toggle | TAB / Shift+TAB                             |
| 3   | Toggle Display Reference Car | Toggle       | Ctrl+C                                      |
| 4   | Starter                      | Button       | S key                                       |
| 5   | Ignition                     | Button       | I key                                       |
| 6   | Pit Speed Limiter            | Toggle       | A key                                       |
| 7   | Enter/Exit/Tow Car           | Button       | Shift+R                                     |
| 8   | Autofuel Toggle              | Toggle       | Shift+Ctrl+A                                |
| 9   | Autofuel Lap Margin          | +/-          | Shift+Alt+X / Shift+Alt+S                   |
| 10  | Toggle Dash Box              | Toggle       | D key                                       |
| 11  | Trigger Windshield Wipers    | Button       | Ctrl+Alt+W                                  |
| 12  | Look Direction               | Multi-toggle | Z, X, up, down (4 directions in one action) |
| 13  | FOV Adjust                   | +/-          | [ / ] keys                                  |
| 14  | Horizon Adjust (VanishY)     | +/-          | Shift+[ / Shift+]                           |
| 15  | Driver Height Adjust         | +/-          | Ctrl+[ / Ctrl+]                             |
| 16  | Recenter VR View             | Button       | ; key                                       |
| 17  | Speed/Gear/Pedals Display    | Toggle       | P key                                       |
| 18  | Radio Display                | Toggle       | O key                                       |
| 19  | FPS/Network Display          | Toggle       | F key                                       |
| 20  | Report Latency               | Button       | L key                                       |
| 21  | Toggle Weather Radar         | Toggle       | Shift+Alt+R                                 |
| 22  | Toggle Virtual Mirror        | Toggle       | Alt+M                                       |
| 23  | Toggle UI Edit               | Toggle       | Alt+K                                       |
| 24  | UI Size Adjust               | +/-          | Ctrl+PageUp/Down                            |
| 25  | Pause Sim                    | Toggle       | Shift+P                                     |
| 26  | Set FFB Max Force            | Adjustment   | SDK                                         |
| 27  | Adjust Master Volume         | +/-          | Shift+Alt+NUMPAD -/+                        |

**Total: 27 actions (18 single-key, 9 adjustable)**

---

## Plugin 2: `com.iracedeck.sd.pit` (Pit Service Plugin) ✓ Exists

Pit stop management with SDK integration. Maps to "Pit Service" section.

| #   | Action                   | Type         | Notes                                |
| --- | ------------------------ | ------------ | ------------------------------------ |
| 1   | Clear All Pit Checkboxes | Button       | SDK                                  |
| 2   | Windshield Tearoff       | Toggle       | SDK - toggle on/off                  |
| 3   | Request Fuel             | Adjustment   | SDK                                  |
| 4   | Clear Fuel Checkbox      | Button       | SDK                                  |
| 5   | Request Tire             | Configurable | SDK - select LF/RF/LR/RR in settings |
| 6   | Clear Tires Checkbox     | Button       | SDK                                  |
| 7   | Request Fast Repair      | Toggle       | SDK - toggle on/off                  |
| 8   | Change Tire Compound     | Selector     | SDK                                  |

**Total: 8 actions (4 single-key, 4 adjustable)**

---

## Plugin 3: `com.iracedeck.sd.comms` (Communication Plugin) ✓ Exists

Chat, radio, and spotter functions. Maps to "Chat" section.

| #   | Action                   | Type         | Notes                                 |
| --- | ------------------------ | ------------ | ------------------------------------- |
| 1   | Text Chat                | Button       | T key, SDK                            |
| 2   | Text Chat Reply          | Button       | R key, SDK                            |
| 3   | Whisper/Selective Chat   | Button       | / [num]                               |
| 4   | Respond to Last PM       | Button       | /r, SDK                               |
| 5   | Send Chat Message        | Configurable | SDK - preset messages                 |
| 6   | Chat Macro (1–15)        | Configurable | SDK - select macro number in settings |
| 7   | Cancel Chat              | Button       | SDK                                   |
| 8   | Adjust Spotter Volume    | +/-          | Shift+Ctrl+NUMPAD -/+                 |
| 9   | Spotter Silence          | Toggle       | Shift+Ctrl+M                          |
| 10  | Adjust Voice Chat Volume | +/-          | Shift+Ctrl+Alt+NUMPAD -/+             |
| 11  | Mute Voice Chat          | Toggle       | Shift+Ctrl+Alt+M                      |

**Total: 11 actions (7 single-key, 4 adjustable)**

---

## Plugin 4: `com.iracedeck.sd.replay` (Replay Plugin) - NEW

Replay and camera controls. Maps to "Replay" section.

| #   | Action                      | Type         | Notes               |
| --- | --------------------------- | ------------ | ------------------- |
| 1   | Play                        | Button       | SDK                 |
| 2   | Pause                       | Button       | SDK                 |
| 3   | Stop                        | Button       | NUMPAD ., SDK       |
| 4   | Fast Forward                | Button       | Shift+NUMPAD 6, SDK |
| 5   | Rewind                      | Button       | Shift+NUMPAD 4, SDK |
| 6   | Set Playback Speed          | Adjustment   | SDK                 |
| 7   | Slow Motion                 | Toggle       | NUMPAD 8, SDK       |
| 8   | Frame Step Forward          | Button       | NUMPAD 6, SDK       |
| 9   | Frame Step Backward         | Button       | NUMPAD 4, SDK       |
| 10  | Jump to Next Session        | Button       | Ctrl+NUMPAD 6, SDK  |
| 11  | Jump to Previous Session    | Button       | Ctrl+NUMPAD 4, SDK  |
| 12  | Jump to Next Lap            | Button       | Shift+NUMPAD 3, SDK |
| 13  | Jump to Previous Lap        | Button       | Shift+NUMPAD 1, SDK |
| 14  | Jump to Next Incident       | Button       | Ctrl+NUMPAD 3, SDK  |
| 15  | Jump to Previous Incident   | Button       | Ctrl+NUMPAD 1, SDK  |
| 16  | Jump to Start               | Button       | NUMPAD 7, SDK       |
| 17  | Jump to End                 | Button       | NUMPAD 1, SDK       |
| 18  | Set Play Position           | Configurable | SDK                 |
| 19  | Search Session Time         | Configurable | SDK                 |
| 20  | Erase Tape                  | Button       | SDK                 |
| 21  | Cycle Camera                | Button       | C / Shift+C, SDK    |
| 22  | Cycle Sub Camera            | Button       | B / Shift+B, SDK    |
| 23  | Cycle Car                   | Button       | V / Shift+V, SDK    |
| 24  | Focus Your Car              | Button       | Ctrl+V, SDK         |
| 25  | Cycle Driving Camera        | +/-          | PageUp/Down, SDK    |
| 26  | Switch Camera by Position   | Configurable | SDK                 |
| 27  | Switch Camera by Car Number | Configurable | SDK                 |
| 28  | Set Camera State            | Configurable | SDK                 |
| 29  | Toggle UI Visibility        | Toggle       | SDK                 |
| 30  | Focus on Leader             | Button       | SDK                 |
| 31  | Focus on Incident           | Button       | SDK                 |

**Total: 31 actions (24 single-key, 7 adjustable)**

---

## Plugin 5: `com.iracedeck.sd.media` (Media & Telemetry Plugin) - NEW

Recording, screenshots, and telemetry. Maps to "Camera & Screen Capture" and "Telemetry" sections.

| #   | Action                       | Type         | Notes                   |
| --- | ---------------------------- | ------------ | ----------------------- |
| 1   | Toggle Telemetry Logging     | Toggle       | Alt+L, SDK              |
| 2   | Mark Telemetry Event         | Button       | M key                   |
| 3   | Toggle Telemetry Recording   | Toggle       | SDK - start/stop        |
| 4   | Restart Telemetry Recording  | Button       | SDK                     |
| 5   | Video Timer                  | Toggle       | Alt+V, SDK              |
| 6   | Start/Stop Video Recording   | Toggle       | Ctrl+Alt+Shift+V, SDK   |
| 7   | Take Screenshot              | Button       | Ctrl+Alt+Shift+S, SDK   |
| 8   | Take Giant Screenshot        | Button       | Ctrl+Shift+Print Screen |
| 9   | Toggle Video Capture         | Toggle       | SDK                     |
| 10  | Reload All Textures          | Button       | Ctrl+R, SDK             |
| 11  | Reload Specific Car Textures | Configurable | SDK                     |
| 12  | Focus on Exiting Cars        | Button       | SDK                     |

**Total: 12 actions (6 single-key, 6 adjustable)**

---

## Plugin 6: `com.iracedeck.sd.setup` (Car Setup Adjustments Plugin) - NEW

In-car adjustments during driving. Maps to "Car Setup Adjustments" section.

> **Note:** Settings ending with "Set" require two button bindings in iRacing — one for increase, one for decrease. Settings ending with "Toggle" or "Hold" only require a single button.

| #   | Action                   | Type         | Notes                                        |
| --- | ------------------------ | ------------ | -------------------------------------------- |
| 1   | ABS Toggle               | Toggle       | -                                            |
| 2   | Adjust ABS               | Adjustment   | ABS Set                                      |
| 3   | Adjust Brake Bias        | +/-          | - / = keys, Brake Bias Set                   |
| 4   | Adjust Brake Bias Fine   | Adjustment   | Brake Bias Fine Set                          |
| 5   | Adjust Peak Brake Bias   | Adjustment   | Peak Brake Bias Set                          |
| 6   | Adjust Brake Misc        | Adjustment   | Brake Misc. Set                              |
| 7   | Adjust Engine Braking    | Adjustment   | Engine Braking Set                           |
| 8   | Adjust Engine Power      | Adjustment   | Engine Power Set                             |
| 9   | Adjust Throttle Shaping  | Adjustment   | Throttle Shaping Set                         |
| 10  | Adjust Boost Level       | Adjustment   | Boost Level Set                              |
| 11  | Adjust Launch RPM        | Adjustment   | Launch RPM Set                               |
| 12  | FCY Mode Toggle          | Toggle       | -                                            |
| 13  | Adjust Fuel Mixture      | Adjustment   | Fuel Mixture Set                             |
| 14  | Adjust Fuel Cut Position | Adjustment   | Fuel Cut Position Set                        |
| 15  | Disable Fuel Cut         | Toggle       | -                                            |
| 16  | Low Fuel Accept          | Button       | -                                            |
| 17  | Traction Control Toggle  | Toggle       | -                                            |
| 18  | Adjust Traction Control  | Configurable | Select TC slot 1-4 in settings               |
| 19  | Adjust Differential      | Configurable | Select preload/entry/middle/exit in settings |
| 20  | Adjust Anti-Roll Bar     | Configurable | Select front/rear in settings                |
| 21  | Adjust Power Steering    | Adjustment   | Power Steering Set                           |
| 22  | Adjust Dash Page         | Configurable | Select page 1/2 in settings                  |
| 23  | In Lap Mode Toggle       | Toggle       | Shift+Alt+L                                  |

**Total: 23 actions (7 single-key, 16 adjustable)**

---

## Plugin 7: `com.iracedeck.sd.setup-ext` (Car Setup Extended Plugin) - NEW

Additional car setup adjustments (shocks, aero, hybrid). Maps to remaining "Car Setup Adjustments" subsections.

| #   | Action                    | Type         | Notes                          |
| --- | ------------------------- | ------------ | ------------------------------ |
| 1   | Adjust Spring             | Configurable | Select left/right in settings  |
| 2   | Adjust Shock              | Configurable | Select LF/RF/LR/RR in settings |
| 3   | RF Brake Attached Toggle  | Toggle       | -                              |
| 4   | Adjust Wing               | Configurable | Select front/rear in settings  |
| 5   | Adjust Qualifying Tape    | Adjustment   | Qualifying Tape Set            |
| 6   | Adjust MGU-K Re-Gen Gain  | Adjustment   | MGU-K Re-Gen Gain Set          |
| 7   | Adjust MGU-K Deploy Mode  | Adjustment   | MGU-K Deploy Mode Set          |
| 8   | Adjust MGU-K Fixed Deploy | Adjustment   | MGU-K Fixed Deploy Set         |
| 9   | HYS Boost Hold            | Hold         | -                              |
| 10  | HYS Regen Hold            | Hold         | -                              |
| 11  | HYS No Boost Toggle       | Toggle       | -                              |

**Total: 11 actions (3 single-key, 8 adjustable)**

---

## Plugin 8: `com.iracedeck.sd.camera-editor` (Camera Editor Plugin) - NEW

Advanced camera editing - for broadcasters/content creators. Maps to "Camera Editor" section.

| #   | Action                  | Type   | Notes           |
| --- | ----------------------- | ------ | --------------- |
| 1   | Open Camera Tool        | Button | Ctrl+F12        |
| 2   | Adjust Latitude         | +/-    | D / A           |
| 3   | Adjust Longitude        | +/-    | S / W           |
| 4   | Adjust Altitude         | +/-    | Alt+S / Alt+W   |
| 5   | Adjust Yaw              | +/-    | Ctrl+D / Ctrl+A |
| 6   | Adjust Pitch            | +/-    | Ctrl+W / Ctrl+S |
| 7   | Adjust FOV Zoom         | +/-    | [ / ]           |
| 8   | Adjust Key Step Factor  | +/-    | - / =           |
| 9   | Toggle Key Acceleration | Toggle | Ctrl+P          |
| 10  | Toggle Key 10x          | Toggle | Alt+P           |
| 11  | Adjust Mic Gain         | +/-    | Alt+Up/Down     |
| 12  | Auto Set Mic Gain       | Button | Ctrl+Alt+Down   |
| 13  | Toggle Parabolic Mic    | Toggle | Ctrl+O          |
| 14  | Cycle Position Type     | Button | Alt+N           |
| 15  | Cycle Aim Type          | Button | Alt+M           |
| 16  | Acquire Start           | Button | Ctrl+Q          |
| 17  | Acquire End             | Button | Shift+Q         |
| 18  | Toggle Temporary Edits  | Toggle | Ctrl+L          |
| 19  | Adjust VanishX          | +/-    | Alt+X / Ctrl+X  |
| 20  | Adjust VanishY          | +/-    | Alt+Y / Ctrl+Y  |
| 21  | Adjust Blimp Radius     | +/-    | Ctrl+H / Ctrl+G |
| 22  | Adjust Blimp Velocity   | +/-    | Alt+H / Alt+G   |
| 23  | Toggle Dampening        | Toggle | Ctrl+N          |
| 24  | Toggle Zoom             | Toggle | Ctrl+M          |
| 25  | Toggle Beyond Fence     | Toggle | Ctrl+B          |
| 26  | Toggle In Cockpit       | Toggle | Alt+B           |
| 27  | Toggle Mouse Navigation | Toggle | Ctrl+Z          |
| 28  | Toggle Pitch Gyro       | Toggle | Ctrl+J          |
| 29  | Toggle Roll Gyro        | Toggle | Alt+J           |
| 30  | Toggle Limit Shot Range | Toggle | Alt+O           |
| 31  | Toggle Show Camera      | Toggle | Alt+Q           |
| 32  | Toggle Shot Selection   | Toggle | Ctrl+T          |

**Total: 32 actions (18 single-key, 14 adjustable)** — at limit

---

## Plugin 9: `com.iracedeck.sd.camera-editor-ext` (Camera Editor Extended) - NEW

Camera management and file operations - for broadcasters. Maps to remaining "Camera Editor" subsections.

| #   | Action              | Type   | Notes             |
| --- | ------------------- | ------ | ----------------- |
| 1   | Adjust F-number     | +/-    | Alt+U / Alt+I     |
| 2   | Toggle Manual Focus | Toggle | Ctrl+F            |
| 3   | Adjust Focus Depth  | +/-    | Ctrl+U / Ctrl+I   |
| 4   | Insert Camera       | Button | Shift+Ctrl+Insert |
| 5   | Remove Camera       | Button | Shift+Ctrl+Delete |
| 6   | Copy Camera         | Button | Shift+Ctrl+C      |
| 7   | Paste Camera        | Button | Shift+Ctrl+V      |
| 8   | Copy Group          | Button | Ctrl+Alt+C        |
| 9   | Paste Group         | Button | Ctrl+Alt+V        |
| 10  | Save Track Camera   | Button | Ctrl+F11          |
| 11  | Load Track Camera   | Button | Shift+Ctrl+F11    |
| 12  | Save Car Camera     | Button | Alt+F11           |
| 13  | Load Car Camera     | Button | Shift+Alt+F11     |

**Total: 13 actions (11 single-key, 2 adjustable)**

---

## Summary

| Plugin                               | Focus                            | Actions | Adjustable | Status |
| ------------------------------------ | -------------------------------- | ------- | ---------- | ------ |
| `com.iracedeck.sd.core`              | Core driving & interface         | 27      | 9          | New    |
| `com.iracedeck.sd.pit`               | Pit service                      | 8       | 4          | Exists |
| `com.iracedeck.sd.comms`             | Chat, radio & spotter            | 11      | 4          | Exists |
| `com.iracedeck.sd.replay`            | Replay & camera                  | 31      | 7          | New    |
| `com.iracedeck.sd.media`             | Recording & telemetry            | 12      | 6          | New    |
| `com.iracedeck.sd.setup`             | Car setup (brakes, TC, diff)     | 23      | 16         | New    |
| `com.iracedeck.sd.setup-ext`         | Car setup (shocks, aero, hybrid) | 11      | 8          | New    |
| `com.iracedeck.sd.camera-editor`     | Camera editing                   | 32      | 14         | New    |
| `com.iracedeck.sd.camera-editor-ext` | Camera management                | 13      | 2          | New    |

**Total: 168 actions (98 single-key, 70 adjustable) across 9 plugins**

---

## Notes

- Actions marked "SDK" can use iRacing SDK broadcast messages
- Actions without SDK support require keyboard simulation (user-configurable keybindings)
- Car Setup plugins cover all in-car adjustments (none have SDK support)
- Camera Editor plugins target broadcasters/content creators
- Multi-toggle actions (like Black Box Selector) count as 1 action but provide multiple options via dropdown
- Configurable actions have settings (e.g., Look Direction has dropdown for direction choice)
- All plugins are standalone — they cannot communicate with each other
- Connection status is indicated by dimming all actions when disconnected
- Replay plugin has 31 actions with room for 1 more
- See [keyboard-shortcuts.md](keyboard-shortcuts.md) for full reference of iRacing settings names
