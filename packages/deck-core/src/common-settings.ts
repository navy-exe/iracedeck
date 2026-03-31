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
export const ColorOverridesSchema = z
  .object({
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    graphic1Color: z.string().optional(),
    graphic2Color: z.string().optional(),
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
    fontSize: z.coerce.number().min(5).max(50).optional(),
    position: z
      .union([z.enum(["top", "middle", "bottom", "custom", "inherit"]), z.string()])
      .transform((val) => {
        if (val === "inherit" || val === "") return undefined;

        return val as "top" | "middle" | "bottom" | "custom";
      })
      .optional(),
    customPosition: z.coerce.number().min(-50).max(50).optional(),
  })
  .optional();

export type TitleOverrides = z.infer<typeof TitleOverridesSchema>;

export const CommonSettings = z.object({
  flagsOverlay: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .optional(),
  colorOverrides: ColorOverridesSchema,
  titleOverrides: TitleOverridesSchema,
});

export type CommonSettings = z.infer<typeof CommonSettings>;
