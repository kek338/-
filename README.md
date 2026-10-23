# 物语工坊

一个从两张产品实拍图生成电商视觉故事的工作台：1 张主图、9 张分别展示不同卖点的副图。

## 本地运行

需要 Node.js 20 或更新版本，以及可调用 OpenAI 图片 API 的密钥。

```bash
cd /workspace/-
npm ci --cache /workspace/.npm-cache --no-audit --no-fund
npm run dev
```

运行前，可以通过云环境设置安全配置 `IMAGE_API_KEY`。本机双击运行包也允许在页面临时粘贴自己的密钥：它只保留在当前页面内，通过本机服务转发给图片 API，不写入项目文件。不要把密钥写进代码、图片或提交记录。`/api/health` 会显示运行环境是否配置了密钥。

## Windows 双击运行包

运行 `bash scripts/package-windows.sh` 会从 Node.js 官方下载 Windows x64 运行时、按官方 SHA256 校验，并将 Next.js 独立服务、静态文件和启动器打包为 `dist/story-studio-windows-x64.zip`，同时把可交付副本放在 `/workspace/scratch`。解压后双击 `Start Studio.bat`，无需在 Windows 上安装 Node.js。Windows 包内附有中文使用说明。图片生成仍需要联网和可用的 API 密钥。

如果只需要在 Windows 浏览器里双击打开，运行 `npm run build:single` 可生成一个不需要解压、安装或启动服务器的 `story-studio-double-click.html`。该单文件版本直接从浏览器向 OpenAI 发送请求；密钥只保留在当前页面，关闭或刷新后需要重新填写。图片生成仍需联网、有可用额度的 OpenAI API 密钥和支持现代网页的浏览器。

## 使用流程

1. 上传同一产品的两张不同角度照片（JPG、PNG、WebP，每张不超过 15 MB）。
2. 可填写产品名称、已确认的卖点，并选择视觉风格。
3. 点击生成。服务端先用视觉模型规划十张图的叙事，再用两张原图作为每张生成图的参考。图片完成后逐张出现。
4. 可逐张下载，或将已完成图片打包为 ZIP。下载时会在图片上加入标题与副标题。

生成会调用 `gpt-4.1-mini` 和 `gpt-image-1.5`，产生 API 费用。生成结果可能偏离原产品细节；用于商品发布前，请核对外观、卖点和文案。生成图片仅在当前浏览器页面内暂存，刷新页面会清空。

## 检查

```bash
npm run typecheck
npm run build
npm run dev
curl -fsS http://localhost:3000/api/health
```
