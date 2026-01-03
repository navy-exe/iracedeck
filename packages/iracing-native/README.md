# @iracedeck/iracing-native

Native Node.js addon for iRacing SDK integration. Provides low-level access to Windows APIs for memory-mapped files and window messaging.

## Installation

```bash
pnpm add @iracedeck/iracing-native
```

### Build Requirements

This package requires native compilation:

- **Node.js** 20 or later
- **Python** 3.x
- **Visual Studio Build Tools** with "Desktop development with C++" workload

## API

### Memory-Mapped Files

```typescript
import { closeMemoryMap, openMemoryMap, readMemory } from "@iracedeck/iracing-native";

// Open iRacing's shared memory
const handle = openMemoryMap("Local\\IRSDKMemMapFileName");

if (handle !== 0) {
    // Read 144 bytes from offset 0 (header)
    const headerBuffer = readMemory(handle, 0, 144);

    // Close when done
    closeMemoryMap(handle);
}
```

### Window Messaging

```typescript
import { findWindow, HWND_BROADCAST, registerWindowMessage, sendNotifyMessage } from "@iracedeck/iracing-native";

// Find iRacing window
const hwnd = findWindow("SimWinClass", null);

// Register broadcast message
const msgId = registerWindowMessage("CYCLISTSDK_EVENT");

// Send broadcast message
sendNotifyMessage(HWND_BROADCAST, msgId, wParam, lParam);
```

### Chat Messages

```typescript
import { sendChatString, sendKeyPress, VK_RETURN } from "@iracedeck/iracing-native";

// Send text to a window using WM_CHAR (optimized C++ loop)
sendChatString(hwnd, "Hello World!");

// Send Enter key
sendKeyPress(hwnd, VK_RETURN);
```

## Exported Functions

| Function                                       | Description                               |
| ---------------------------------------------- | ----------------------------------------- |
| `openMemoryMap(name)`                          | Open a memory-mapped file, returns handle |
| `closeMemoryMap(handle)`                       | Close a memory-mapped file                |
| `readMemory(handle, offset, length)`           | Read bytes from memory map                |
| `findWindow(className, windowName)`            | Find a window by class/title              |
| `registerWindowMessage(name)`                  | Register a window message                 |
| `sendMessage(hwnd, msg, wParam, lParam)`       | Send message (blocking)                   |
| `postMessage(hwnd, msg, wParam, lParam)`       | Post message (non-blocking)               |
| `sendNotifyMessage(hwnd, msg, wParam, lParam)` | Send notify message                       |
| `sendChatString(hwnd, text)`                   | Send string via WM_CHAR                   |
| `sendKeyPress(hwnd, vkCode)`                   | Send key press                            |
| `getLastError()`                               | Get last Win32 error code                 |

## Constants

| Constant         | Value  | Description              |
| ---------------- | ------ | ------------------------ |
| `HWND_BROADCAST` | 0xFFFF | Broadcast to all windows |
| `WM_KEYDOWN`     | 0x0100 | Key down message         |
| `WM_KEYUP`       | 0x0101 | Key up message           |
| `WM_CHAR`        | 0x0102 | Character message        |
| `VK_RETURN`      | 0x0D   | Enter key                |

## Building

```bash
# Install dependencies
pnpm install

# Build native addon and TypeScript
pnpm run build

# Clean build artifacts
pnpm run clean
```

## Platform Support

- **Windows only** - Uses Win32 APIs (kernel32.dll, user32.dll)
- **x64 architecture**

## License

MIT
