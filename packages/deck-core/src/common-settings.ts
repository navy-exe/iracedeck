import z from "zod";

/**
 * Common settings shared by all actions.
 * All action settings schemas should extend this.
 *
 * @example
 * ```typescript
 * const MyActionSettings = CommonSettings.extend({
 *   direction: z.enum(["next", "previous"]).default("next"),
 * });
 * ```
 */
/**
 * Schema for per-action color overrides.
 * Only set fields override; unset fields fall through to global → icon default.
 */
// Normalize empty strings and legacy #000001 sentinel to undefined (meaning "not set")
const colorField = z.preprocess(
  (val) => (val === "" || val === "#000001" || val === null || val === undefined ? undefined : val),
  z.string().optional(),
);

export const ColorOverridesSchema = z
  .object({
    backgroundColor: colorField,
    textColor: colorField,
    graphic1Color: colorField,
    graphic2Color: colorField,
  })
  .optional();

export type ColorOverrides = z.infer<typeof ColorOverridesSchema>;

export const TitleOverridesSchema = z
  .object({
    showTitle: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (val === "inherit" || val === "") return undefined;

        return val === true || val === "true";
      })
      .optional(),
    showGraphics: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (val === "inherit" || val === "") return undefined;

        return val === true || val === "true";
      })
      .optional(),
    titleText: z.string().optional(),
    bold: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (val === "inherit" || val === "") return undefined;

        return val === true || val === "true";
      })
      .optional(),
    fontSizeEnabled: z
      .union([z.boolean(), z.string()])
      .transform((val) => val === true || val === "true")
      .optional(),
    fontSize: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce.number().min(5).max(100).optional(),
    ),
    position: z
      .union([z.enum(["top", "middle", "bottom", "custom", "inherit"]), z.string()])
      .transform((val) => {
        if (val === "inherit" || val === "") return undefined;

        return val as "top" | "middle" | "bottom" | "custom";
      })
      .optional(),
    customPosition: z.coerce.number().min(-100).max(100).optional(),
  })
  .optional();

export type TitleOverrides = z.infer<typeof TitleOverridesSchema>;

/**
 * Inherit/Yes/No tri-state transform for border settings.
 * "inherit" or "" → undefined (fall through to global → icon default).
 */
const inheritBooleanField = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (val === "inherit" || val === "") return undefined;

    return val === true || val === "true";
  })
  .optional();

/**
 * Schema for per-action border overrides.
 * Fields set to "inherit" (or undefined) fall through to global → icon default.
 */
export const BorderOverridesSchema = z
  .object({
    enabled: inheritBooleanField,
    borderWidth: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;

      const n = Number(val);

      return Number.isFinite(n) ? Math.min(n, 20) : val;
    }, z.coerce.number().min(1).max(20).optional()),
    // #000001 is the legacy "not set" sentinel from <sdpi-color> era — kept for backward compat
    borderColor: z.preprocess(
      (val) => (val === "" || val === "#000001" || val === null || val === undefined ? undefined : val),
      z.string().optional(),
    ),
    glowEnabled: inheritBooleanField,
    glowWidth: z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;

      const n = Number(val);

      return Number.isFinite(n) ? Math.min(n, 30) : val;
    }, z.coerce.number().min(1).max(30).optional()),
  })
  .optional();

export type BorderOverrides = z.infer<typeof BorderOverridesSchema>;

/**
 * Schema for per-action graphic overrides (scaling).
 * scaleMode controls how the scale is determined:
 *   "inherit" (default) → falls through to global graphic scale setting
 *   "default" → uses 100% (icon's natural fit-to-area scale, ignoring global)
 *   "override" → uses the custom scale value from the range slider
 */
export const GraphicOverridesSchema = z
  .object({
    scaleMode: z
      .union([z.enum(["inherit", "default", "override"]), z.string()])
      .transform((val) => {
        if (val === "inherit" || val === "") return undefined;

        return val as "default" | "override";
      })
      .optional(),
    scale: z.preprocess(
      (val) => (val === "" || val === null || val === undefined ? undefined : val),
      z.coerce.number().min(50).max(150).optional(),
    ),
  })
  .optional();

export type GraphicOverrides = z.infer<typeof GraphicOverridesSchema>;

export const CommonSettings = z.object({
  addedWithVersion: z.string().default("0.0.0"),
  flagsOverlay: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .optional(),
  colorOverrides: ColorOverridesSchema,
  titleOverrides: TitleOverridesSchema,
  borderOverrides: BorderOverridesSchema,
  graphicOverrides: GraphicOverridesSchema,
});

export type CommonSettings = z.infer<typeof CommonSettings>;
