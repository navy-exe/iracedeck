/**
 * @iracedeck/iracing-native
 *
 * Native Node.js addon for iRacing SDK integration.
 * Provides Win32 memory-mapped file access and window messaging.
 */

#include <napi.h>
#include <windows.h>
#include <string>

/**
 * Open a memory-mapped file by name
 * @param name - Name of the memory-mapped file (e.g., "Local\\IRSDKMemMapFileName")
 * @returns Handle as number, or 0 on failure
 */
Napi::Value OpenMemoryMap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String argument expected for memory map name").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string name = info[0].As<Napi::String>().Utf8Value();

    HANDLE hMapFile = OpenFileMappingA(FILE_MAP_READ, FALSE, name.c_str());

    if (hMapFile == NULL || hMapFile == INVALID_HANDLE_VALUE) {
        return Napi::Number::New(env, 0);
    }

    // Map the file into memory
    LPVOID pMem = MapViewOfFile(hMapFile, FILE_MAP_READ, 0, 0, 0);

    if (pMem == NULL) {
        CloseHandle(hMapFile);
        return Napi::Number::New(env, 0);
    }

    // Store both handles - we'll use the mapped pointer as the "handle" for reading
    // In practice, we return the pointer cast to a number
    return Napi::Number::New(env, reinterpret_cast<uintptr_t>(pMem));
}

/**
 * Close a memory-mapped file
 * @param handle - Handle returned from OpenMemoryMap
 */
Napi::Value CloseMemoryMap(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Number argument expected for handle").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    uintptr_t ptr = static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value());

    if (ptr != 0) {
        UnmapViewOfFile(reinterpret_cast<LPVOID>(ptr));
        // Note: We don't have the original file handle here, so we can't close it
        // In a production implementation, we'd want to track both handles
    }

    return env.Undefined();
}

/**
 * Read bytes from a memory-mapped file
 * @param handle - Handle returned from OpenMemoryMap
 * @param offset - Byte offset to start reading from
 * @param length - Number of bytes to read
 * @returns Buffer containing the bytes
 */
Napi::Value ReadMemory(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 3 || !info[0].IsNumber() || !info[1].IsNumber() || !info[2].IsNumber()) {
        Napi::TypeError::New(env, "Expected (handle: number, offset: number, length: number)").ThrowAsJavaScriptException();
        return env.Null();
    }

    uintptr_t ptr = static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value());
    uint32_t offset = info[1].As<Napi::Number>().Uint32Value();
    uint32_t length = info[2].As<Napi::Number>().Uint32Value();

    if (ptr == 0) {
        Napi::Error::New(env, "Invalid handle").ThrowAsJavaScriptException();
        return env.Null();
    }

    // Create a buffer and copy the data
    Napi::Buffer<uint8_t> buffer = Napi::Buffer<uint8_t>::New(env, length);
    uint8_t* basePtr = reinterpret_cast<uint8_t*>(ptr);
    memcpy(buffer.Data(), basePtr + offset, length);

    return buffer;
}

/**
 * Find a window by class name and/or window title
 * @param className - Window class name (or null)
 * @param windowName - Window title (or null)
 * @returns Window handle as number, or 0 if not found
 */
Napi::Value FindWindowByName(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    const char* className = nullptr;
    const char* windowName = nullptr;
    std::string classNameStr, windowNameStr;

    if (info.Length() >= 1 && info[0].IsString()) {
        classNameStr = info[0].As<Napi::String>().Utf8Value();
        className = classNameStr.c_str();
    }

    if (info.Length() >= 2 && info[1].IsString()) {
        windowNameStr = info[1].As<Napi::String>().Utf8Value();
        windowName = windowNameStr.c_str();
    }

    HWND hwnd = FindWindowA(className, windowName);

    return Napi::Number::New(env, reinterpret_cast<uintptr_t>(hwnd));
}

/**
 * Register a window message by name
 * @param messageName - Name of the message to register
 * @returns Message ID
 */
Napi::Value RegisterWindowMessageWrapper(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String argument expected for message name").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string name = info[0].As<Napi::String>().Utf8Value();
    UINT msgId = RegisterWindowMessageA(name.c_str());

    return Napi::Number::New(env, msgId);
}

/**
 * Send a message to a window (blocking)
 * @param hwnd - Window handle
 * @param msg - Message ID
 * @param wParam - First parameter
 * @param lParam - Second parameter
 * @returns Result of SendMessage
 */
Napi::Value SendMessageToWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected (hwnd, msg, wParam, lParam)").ThrowAsJavaScriptException();
        return env.Null();
    }

    HWND hwnd = reinterpret_cast<HWND>(static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value()));
    UINT msg = info[1].As<Napi::Number>().Uint32Value();
    WPARAM wParam = static_cast<WPARAM>(info[2].As<Napi::Number>().Int64Value());
    LPARAM lParam = static_cast<LPARAM>(info[3].As<Napi::Number>().Int64Value());

    LRESULT result = SendMessageW(hwnd, msg, wParam, lParam);

    return Napi::Number::New(env, static_cast<double>(result));
}

/**
 * Post a message to a window (non-blocking)
 * @param hwnd - Window handle
 * @param msg - Message ID
 * @param wParam - First parameter
 * @param lParam - Second parameter
 * @returns Success boolean
 */
Napi::Value PostMessageToWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected (hwnd, msg, wParam, lParam)").ThrowAsJavaScriptException();
        return env.Null();
    }

    HWND hwnd = reinterpret_cast<HWND>(static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value()));
    UINT msg = info[1].As<Napi::Number>().Uint32Value();
    WPARAM wParam = static_cast<WPARAM>(info[2].As<Napi::Number>().Int64Value());
    LPARAM lParam = static_cast<LPARAM>(info[3].As<Napi::Number>().Int64Value());

    BOOL result = PostMessageW(hwnd, msg, wParam, lParam);

    return Napi::Boolean::New(env, result != 0);
}

/**
 * Send a notify message (non-blocking broadcast)
 * @param hwnd - Window handle (use 0xFFFF for HWND_BROADCAST)
 * @param msg - Message ID
 * @param wParam - First parameter
 * @param lParam - Second parameter
 * @returns Success boolean
 */
Napi::Value SendNotifyMessageToWindow(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 4) {
        Napi::TypeError::New(env, "Expected (hwnd, msg, wParam, lParam)").ThrowAsJavaScriptException();
        return env.Null();
    }

    uintptr_t hwndVal = static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value());
    HWND hwnd;

    // Handle HWND_BROADCAST (0xFFFF)
    if (hwndVal == 0xFFFF) {
        hwnd = HWND_BROADCAST;
    } else {
        hwnd = reinterpret_cast<HWND>(hwndVal);
    }

    UINT msg = info[1].As<Napi::Number>().Uint32Value();
    WPARAM wParam = static_cast<WPARAM>(info[2].As<Napi::Number>().Int64Value());
    LPARAM lParam = static_cast<LPARAM>(info[3].As<Napi::Number>().Int64Value());

    BOOL result = SendNotifyMessageW(hwnd, msg, wParam, lParam);

    return Napi::Boolean::New(env, result != 0);
}

/**
 * Send a string to a window using WM_CHAR messages (optimized C++ loop)
 * This is more efficient than calling SendMessage for each character from JS
 * @param hwnd - Window handle
 * @param text - String to send
 * @returns Success boolean
 */
Napi::Value SendChatString(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsString()) {
        Napi::TypeError::New(env, "Expected (hwnd: number, text: string)").ThrowAsJavaScriptException();
        return env.Null();
    }

    HWND hwnd = reinterpret_cast<HWND>(static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value()));
    std::u16string text = info[1].As<Napi::String>().Utf16Value();

    if (hwnd == NULL) {
        return Napi::Boolean::New(env, false);
    }

    // Send each character using WM_CHAR
    for (char16_t ch : text) {
        SendMessageW(hwnd, WM_CHAR, static_cast<WPARAM>(ch), 0);
    }

    return Napi::Boolean::New(env, true);
}

/**
 * Send a key press to a window (WM_KEYDOWN + WM_KEYUP)
 * @param hwnd - Window handle
 * @param vkCode - Virtual key code
 */
Napi::Value SendKeyPress(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    if (info.Length() < 2 || !info[0].IsNumber() || !info[1].IsNumber()) {
        Napi::TypeError::New(env, "Expected (hwnd: number, vkCode: number)").ThrowAsJavaScriptException();
        return env.Undefined();
    }

    HWND hwnd = reinterpret_cast<HWND>(static_cast<uintptr_t>(info[0].As<Napi::Number>().Int64Value()));
    UINT vkCode = info[1].As<Napi::Number>().Uint32Value();

    SendMessageW(hwnd, WM_KEYDOWN, vkCode, 0);
    SendMessageW(hwnd, WM_KEYUP, vkCode, 0);

    return env.Undefined();
}

/**
 * Get the last Win32 error code
 * @returns Error code
 */
Napi::Value GetLastWin32Error(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, GetLastError());
}

/**
 * Module initialization
 */
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    // Memory-mapped file operations
    exports.Set("openMemoryMap", Napi::Function::New(env, OpenMemoryMap));
    exports.Set("closeMemoryMap", Napi::Function::New(env, CloseMemoryMap));
    exports.Set("readMemory", Napi::Function::New(env, ReadMemory));

    // Window operations
    exports.Set("findWindow", Napi::Function::New(env, FindWindowByName));
    exports.Set("registerWindowMessage", Napi::Function::New(env, RegisterWindowMessageWrapper));

    // Messaging
    exports.Set("sendMessage", Napi::Function::New(env, SendMessageToWindow));
    exports.Set("postMessage", Napi::Function::New(env, PostMessageToWindow));
    exports.Set("sendNotifyMessage", Napi::Function::New(env, SendNotifyMessageToWindow));

    // Optimized chat
    exports.Set("sendChatString", Napi::Function::New(env, SendChatString));
    exports.Set("sendKeyPress", Napi::Function::New(env, SendKeyPress));

    // Utilities
    exports.Set("getLastError", Napi::Function::New(env, GetLastWin32Error));

    return exports;
}

NODE_API_MODULE(iracing_native, Init)
