import path from "node:path";
import url from "node:url";

import { piTemplatePlugin } from "./pi-template-plugin.mjs";

const packageRoot = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), "../..");

export const partialsDir = path.join(packageRoot, "partials");
export const browserDir = path.join(packageRoot, "browser");

export { piTemplatePlugin };
