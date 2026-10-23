import { build } from "esbuild";
import { readFile, writeFile, mkdir, copyFile, chmod } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const result = await build({
  entryPoints: [join(root, "standalone/main.tsx")],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  target: ["chrome110", "edge110"],
  jsx: "automatic",
  write: false,
  logLevel: "warning",
});
const script = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const css = await readFile(join(root, "app/globals.css"), "utf8");
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>物语工坊 · 产品视觉工作台</title><meta name="description" content="上传两张实拍图，生成一张主图和九张副图。"><style>${css}</style></head><body><div id="root"></div><script>${script}</script></body></html>`.replace(/[ \t]+$/gm, "");
const dist = join(root, "dist");
await mkdir(dist, { recursive: true });
const internal = join(dist, "story-studio-double-click.html");
await writeFile(internal, html, { mode: 0o644 });
const delivery = join(root, "StoryStudio-Windows-DoubleClick.html");
await copyFile(internal, delivery);
await chmod(delivery, 0o644);
console.log(`${delivery} (${Buffer.byteLength(html)} bytes)`);
