import elgatoConfig from "@elgato/prettier-config";

export default {
  ...elgatoConfig,
  tabWidth: 2,
  useTabs: false,
  overrides: [
    ...(elgatoConfig.overrides || []).filter(
      (o) => !o.files?.includes?.("*.json") && o.files !== "*.json",
    ),
    {
      files: ["*.json", "*.jsonc"],
      options: {
        tabWidth: 2,
        useTabs: false,
      },
    },
    {
      files: "*.jsonc",
      options: {
        trailingComma: "none",
      },
    },
  ],
};