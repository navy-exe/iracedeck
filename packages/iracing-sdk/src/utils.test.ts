import { describe, expect, it } from "vitest";

import {
  addFlag,
  addFlags,
  getActiveFlagNames,
  getActiveFlags,
  hasAllFlags,
  hasAnyFlag,
  hasFlag,
  removeFlag,
  removeFlags,
  setFlag,
  toggleFlag,
} from "./utils.js";

// Test enum (mimics iRacing flag enums)
enum TestFlags {
  None = 0,
  Flag1 = 1,
  Flag2 = 2,
  Flag4 = 4,
  Flag8 = 8,
}

describe("hasFlag", () => {
  it("should return true when flag is set", () => {
    expect(hasFlag(TestFlags.Flag1, TestFlags.Flag1)).toBe(true);
    expect(hasFlag(TestFlags.Flag1 | TestFlags.Flag2, TestFlags.Flag1)).toBe(true);
    expect(hasFlag(TestFlags.Flag1 | TestFlags.Flag2, TestFlags.Flag2)).toBe(true);
  });

  it("should return false when flag is not set", () => {
    expect(hasFlag(TestFlags.Flag1, TestFlags.Flag2)).toBe(false);
    expect(hasFlag(TestFlags.None, TestFlags.Flag1)).toBe(false);
  });

  it("should return false for undefined value", () => {
    expect(hasFlag(undefined, TestFlags.Flag1)).toBe(false);
  });

  it("should handle combined flags", () => {
    const combined = TestFlags.Flag1 | TestFlags.Flag4 | TestFlags.Flag8;
    expect(hasFlag(combined, TestFlags.Flag1)).toBe(true);
    expect(hasFlag(combined, TestFlags.Flag4)).toBe(true);
    expect(hasFlag(combined, TestFlags.Flag8)).toBe(true);
    expect(hasFlag(combined, TestFlags.Flag2)).toBe(false);
  });
});

describe("hasAllFlags", () => {
  it("should return true when all flags are set", () => {
    const value = TestFlags.Flag1 | TestFlags.Flag2 | TestFlags.Flag4;
    expect(hasAllFlags(value, [TestFlags.Flag1, TestFlags.Flag2])).toBe(true);
    expect(hasAllFlags(value, [TestFlags.Flag1, TestFlags.Flag2, TestFlags.Flag4])).toBe(true);
  });

  it("should return false when not all flags are set", () => {
    const value = TestFlags.Flag1 | TestFlags.Flag2;
    expect(hasAllFlags(value, [TestFlags.Flag1, TestFlags.Flag4])).toBe(false);
  });

  it("should return false for undefined value", () => {
    expect(hasAllFlags(undefined, [TestFlags.Flag1])).toBe(false);
  });

  it("should return true for empty flags array", () => {
    expect(hasAllFlags(TestFlags.Flag1, [])).toBe(true);
  });
});

describe("hasAnyFlag", () => {
  it("should return true when any flag is set", () => {
    expect(hasAnyFlag(TestFlags.Flag1, [TestFlags.Flag1, TestFlags.Flag2])).toBe(true);
    expect(hasAnyFlag(TestFlags.Flag2, [TestFlags.Flag1, TestFlags.Flag2])).toBe(true);
  });

  it("should return false when no flags are set", () => {
    expect(hasAnyFlag(TestFlags.Flag4, [TestFlags.Flag1, TestFlags.Flag2])).toBe(false);
  });

  it("should return false for undefined value", () => {
    expect(hasAnyFlag(undefined, [TestFlags.Flag1])).toBe(false);
  });

  it("should return false for empty flags array", () => {
    expect(hasAnyFlag(TestFlags.Flag1, [])).toBe(false);
  });
});

describe("getActiveFlags", () => {
  it("should return array of active flag values", () => {
    const value = TestFlags.Flag1 | TestFlags.Flag4;
    const active = getActiveFlags(value, TestFlags);
    expect(active).toContain(TestFlags.Flag1);
    expect(active).toContain(TestFlags.Flag4);
    expect(active).not.toContain(TestFlags.Flag2);
  });

  it("should return empty array for undefined value", () => {
    expect(getActiveFlags(undefined, TestFlags)).toEqual([]);
  });

  it("should return empty array when no flags set", () => {
    expect(getActiveFlags(0, TestFlags)).toEqual([]);
  });
});

describe("getActiveFlagNames", () => {
  it("should return array of active flag names", () => {
    const value = TestFlags.Flag1 | TestFlags.Flag4;
    const names = getActiveFlagNames(value, TestFlags);
    expect(names).toContain("Flag1");
    expect(names).toContain("Flag4");
    expect(names).not.toContain("Flag2");
  });

  it("should return empty array for undefined value", () => {
    expect(getActiveFlagNames(undefined, TestFlags)).toEqual([]);
  });
});

describe("addFlag", () => {
  it("should add flag to value", () => {
    expect(addFlag(0, TestFlags.Flag1)).toBe(TestFlags.Flag1);
    expect(addFlag(TestFlags.Flag1, TestFlags.Flag2)).toBe(TestFlags.Flag1 | TestFlags.Flag2);
  });

  it("should not duplicate already set flag", () => {
    expect(addFlag(TestFlags.Flag1, TestFlags.Flag1)).toBe(TestFlags.Flag1);
  });

  it("should handle undefined value", () => {
    expect(addFlag(undefined, TestFlags.Flag1)).toBe(TestFlags.Flag1);
  });
});

describe("addFlags", () => {
  it("should add multiple flags", () => {
    const result = addFlags(0, [TestFlags.Flag1, TestFlags.Flag2, TestFlags.Flag4]);
    expect(result).toBe(TestFlags.Flag1 | TestFlags.Flag2 | TestFlags.Flag4);
  });

  it("should handle undefined value", () => {
    expect(addFlags(undefined, [TestFlags.Flag1, TestFlags.Flag2])).toBe(TestFlags.Flag1 | TestFlags.Flag2);
  });
});

describe("removeFlag", () => {
  it("should remove flag from value", () => {
    const value = TestFlags.Flag1 | TestFlags.Flag2;
    expect(removeFlag(value, TestFlags.Flag1)).toBe(TestFlags.Flag2);
  });

  it("should not affect other flags", () => {
    const value = TestFlags.Flag1 | TestFlags.Flag2 | TestFlags.Flag4;
    expect(removeFlag(value, TestFlags.Flag2)).toBe(TestFlags.Flag1 | TestFlags.Flag4);
  });

  it("should handle flag not present", () => {
    expect(removeFlag(TestFlags.Flag1, TestFlags.Flag2)).toBe(TestFlags.Flag1);
  });

  it("should handle undefined value", () => {
    expect(removeFlag(undefined, TestFlags.Flag1)).toBe(0);
  });
});

describe("removeFlags", () => {
  it("should remove multiple flags", () => {
    const value = TestFlags.Flag1 | TestFlags.Flag2 | TestFlags.Flag4;
    expect(removeFlags(value, [TestFlags.Flag1, TestFlags.Flag4])).toBe(TestFlags.Flag2);
  });

  it("should handle undefined value", () => {
    expect(removeFlags(undefined, [TestFlags.Flag1])).toBe(0);
  });
});

describe("toggleFlag", () => {
  it("should set flag if not present", () => {
    expect(toggleFlag(0, TestFlags.Flag1)).toBe(TestFlags.Flag1);
  });

  it("should clear flag if present", () => {
    expect(toggleFlag(TestFlags.Flag1, TestFlags.Flag1)).toBe(0);
  });

  it("should only toggle specified flag", () => {
    const value = TestFlags.Flag1 | TestFlags.Flag2;
    expect(toggleFlag(value, TestFlags.Flag1)).toBe(TestFlags.Flag2);
    expect(toggleFlag(value, TestFlags.Flag4)).toBe(TestFlags.Flag1 | TestFlags.Flag2 | TestFlags.Flag4);
  });

  it("should handle undefined value", () => {
    expect(toggleFlag(undefined, TestFlags.Flag1)).toBe(TestFlags.Flag1);
  });
});

describe("setFlag", () => {
  it("should set flag when enabled is true", () => {
    expect(setFlag(0, TestFlags.Flag1, true)).toBe(TestFlags.Flag1);
  });

  it("should clear flag when enabled is false", () => {
    expect(setFlag(TestFlags.Flag1, TestFlags.Flag1, false)).toBe(0);
  });

  it("should handle undefined value", () => {
    expect(setFlag(undefined, TestFlags.Flag1, true)).toBe(TestFlags.Flag1);
    expect(setFlag(undefined, TestFlags.Flag1, false)).toBe(0);
  });
});
