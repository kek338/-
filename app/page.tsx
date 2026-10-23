"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  CircleHelp,
  Image as ImageIcon,
  KeyRound,
  Layers3,
  LoaderCircle,
  Menu,
  Package,
  Plus,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

type Scene = { title: string; subtitle: string; visual: string };
type Shot = Scene & { src?: string };
type Phase = "idle" | "working" | "done" | "error" | "cancelled";

const defaultShots: Shot[] = [
  { title: "一眼心动", subtitle: "产品主图 · 整体价值", visual: "" },
  { title: "从需求开始", subtitle: "生活痛点 · 引发共鸣", visual: "" },
  { title: "刚好的改变", subtitle: "解决方案 · 使用前后", visual: "" },
  { title: "好用有原因", subtitle: "核心卖点 · 一目了然", visual: "" },
  { title: "更多一点好", subtitle: "第二卖点 · 深入了解", visual: "" },
  { title: "细节见真章", subtitle: "材质工艺 · 值得细看", visual: "" },
  { title: "融入每一天", subtitle: "居家场景 · 自然使用", visual: "" },
  { title: "生活不设限", subtitle: "多元场景 · 自由切换", visual: "" },
  { title: "用起来更顺手", subtitle: "体验场景 · 轻松上手", visual: "" },
  { title: "喜欢有迹可循", subtitle: "情绪收束 · 想要拥有", visual: "" },
];

const looks = [
  { id: "editorial", label: "杂志质感", description: "克制、精致、有设计感", swatch: "editorial" },
  { id: "warm", label: "生活温度", description: "自然光、真实日常", swatch: "warm" },
  { id: "modern", label: "现代极简", description: "干净、利落、突出产品", swatch: "modern" },
];

function fileOk(file: File) {
  return ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= 15 * 1024 * 1024;
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawWrapped(ctx: CanvasRenderingContext2D, content: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  let line = "";
  let count = 0;
  for (const char of content) {
    if (ctx.measureText(line + char).width > maxWidth && line) {
      ctx.fillText(line, x, y + count * lineHeight);
      count++;
      if (count >= maxLines) return;
      line = char;
    } else {
      line += char;
    }
  }
  if (line && count < maxLines) ctx.fillText(line, x, y + count * lineHeight);
}

async function composeShot(shot: Shot, index: number): Promise<Blob> {
  if (!shot.src) throw new Error("图片尚未生成");
  const image = new window.Image();
  image.src = shot.src;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器无法导出图片");
  ctx.drawImage(image, 0, 0, 1024, 1024);
  const shade = ctx.createLinearGradient(0, 570, 0, 1024);
  shade.addColorStop(0, "rgba(14, 19, 18, 0)");
  shade.addColorStop(1, "rgba(14, 19, 18, 0.82)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 570, 1024, 454);
  ctx.fillStyle = "#DDEF70";
  ctx.font = "600 25px 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif";
  ctx.fillText(index === 0 ? "PRODUCT STORY / 01" : `PRODUCT STORY / ${String(index + 1).padStart(2, "0")}`, 68, 775);
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 58px 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif";
  drawWrapped(ctx, shot.title, 64, 860, 896, 76, 2);
  ctx.font = "400 31px 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif";
  drawWrapped(ctx, shot.subtitle, 68, 949, 885, 41, 2);
  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片导出失败")), "image/png"));
}

function UploadSlot({ number, file, preview, onChange }: { number: number; file: File | null; preview: string | null; onChange: (file: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const choose = (candidate?: File) => {
    if (!candidate) return;
    if (!fileOk(candidate)) {
      window.alert("请使用 JPG、PNG 或 WebP 图片，单张不超过 15 MB。");
      return;
    }
    onChange(candidate);
  };
  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    choose(event.dataTransfer.files[0]);
  };
  return (
    <div className={`upload-slot ${dragging ? "dragging" : ""} ${preview ? "has-photo" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(event: ChangeEvent<HTMLInputElement>) => choose(event.target.files?.[0])} />
      {preview ? <img src={preview} alt={`产品实拍图 ${number}`} className="uploaded-photo" /> : <div className="upload-icon"><Plus size={25} strokeWidth={1.5} /></div>}
      <div className={`upload-copy ${preview ? "on-photo" : ""}`}>
        <strong>{preview ? `参考图片 0${number}` : `上传实拍图 0${number}`}</strong>
        <span>{preview ? file?.name : number === 1 ? "建议正面或 45° 角" : "建议侧面或细节图"}</span>
      </div>
      <button type="button" className="upload-hit" aria-label={`选择产品实拍图 ${number}`} onClick={() => input.current?.click()} />
      {preview && <button type="button" className="remove-photo" aria-label={`移除产品实拍图 ${number}`} onClick={() => { onChange(null); if (input.current) input.current.value = ""; }}><X size={15} /></button>}
    </div>
  );
}

export default function Home() {
  const [photos, setPhotos] = useState<[File | null, File | null]>([null, null]);
  const [previews, setPreviews] = useState<[string | null, string | null]>([null, null]);
  const [productHint, setProductHint] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [style, setStyle] = useState("editorial");
  const [apiKey, setApiKey] = useState("");
  const [serverKeyConfigured, setServerKeyConfigured] = useState(false);
  const [manualKeyMode, setManualKeyMode] = useState(false);
  const [shots, setShots] = useState<Shot[]>(defaultShots);
  const [productName, setProductName] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [exporting, setExporting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const completed = shots.filter((shot) => Boolean(shot.src)).length;

  useEffect(() => {
    const urls = photos.map((photo) => photo ? URL.createObjectURL(photo) : null) as [string | null, string | null];
    setPreviews(urls);
    return () => urls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
  }, [photos]);

  useEffect(() => {
    fetch("/api/health").then((response) => response.json()).then((data) => setServerKeyConfigured(Boolean(data.imageGenerationConfigured))).catch(() => setServerKeyConfigured(false));
  }, []);

  const setPhoto = (index: number, file: File | null) => setPhotos((current) => current.map((old, i) => i === index ? file : old) as [File | null, File | null]);

  async function generate() {
    if (!photos[0] || !photos[1]) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setShots(defaultShots);
    setPhase("working");
    setActiveIndex(-1);
    setMessage("正在分析两张产品实拍图…");
    const form = new FormData();
    form.set("photoA", photos[0]);
    form.set("photoB", photos[1]);
    form.set("productHint", productHint);
    form.set("sellingPoints", sellingPoints);
    form.set("style", style);
    let finished = false;
    try {
      const response = await fetch("/api/generate", { method: "POST", body: form, signal: controller.signal, headers: apiKey.trim() ? { "x-image-api-key": apiKey.trim() } : undefined });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `生成请求失败（${response.status}）`);
      }
      if (!response.body) throw new Error("浏览器无法读取生成进度");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const handle = (raw: string) => {
        const name = raw.match(/^event: (.+)$/m)?.[1];
        const data = raw.match(/^data: (.+)$/m)?.[1];
        if (!name || !data) return;
        const payload = JSON.parse(data);
        if (name === "status" || name === "progress") setMessage(payload.message);
        if (name === "progress") setActiveIndex(payload.index);
        if (name === "plan") {
          setProductName(payload.productName);
          setShots(payload.scenes.map((scene: Scene) => ({ ...scene })));
        }
        if (name === "image") setShots((current) => current.map((shot, index) => index === payload.index ? { ...shot, src: payload.src } : shot));
        if (name === "done") { finished = true; setPhase("done"); setActiveIndex(-1); setMessage("10 张图片已生成，可以逐张下载或打包导出。"); }
        if (name === "error") throw new Error(payload.message);
      };
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        events.forEach(handle);
      }
      if (buffer.trim()) handle(buffer);
      if (!finished) throw new Error("生成连接提前结束，请保留已完成图片并重试。");
    } catch (error) {
      if (controller.signal.aborted) { setPhase("cancelled"); setMessage("已停止生成，完成的图片仍可下载。"); }
      else { setPhase("error"); setMessage(error instanceof Error ? error.message : "生成失败，请稍后重试。"); }
    } finally {
      abortRef.current = null;
    }
  }

  async function downloadOne(index: number) {
    try {
      setExporting(true);
      const blob = await composeShot(shots[index], index);
      triggerDownload(blob, `${String(index + 1).padStart(2, "0")}-${index === 0 ? "主图" : `副图${index}`}.png`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }

  async function downloadAll() {
    try {
      setExporting(true);
      setMessage("正在打包已生成的图片…");
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      for (let index = 0; index < shots.length; index++) {
        if (shots[index].src) zip.file(`${String(index + 1).padStart(2, "0")}-${index === 0 ? "主图" : `副图${index}`}.png`, await composeShot(shots[index], index));
      }
      triggerDownload(await zip.generateAsync({ type: "blob" }), `${productName || "产品"}-电商宣传图.zip`);
      setMessage(`已打包 ${completed} 张图片。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "打包失败");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Layers3 size={21} strokeWidth={2.2} /></div><div><strong>物语工坊</strong><span>STORYFRAME STUDIO</span></div></div>
        <div className="sidebar-section">工作空间</div>
        <div className="nav-item active"><Sparkles size={17} /><span>AI 图片工作台</span><div className="nav-active-dot" /></div>
        <div className="nav-item quiet"><ImageIcon size={17} /><span>我的创作</span><span className="soon">即将推出</span></div>
        <div className="sidebar-bottom"><div className="sidebar-tip"><div className="tip-orbit"><Sparkles size={20} /></div><strong>让产品自己讲故事</strong><p>从两张实拍开始，生成完整的视觉购买旅程。</p></div><div className="sidebar-footer"><CircleHelp size={16} /><span>创作指南</span><ArrowRight size={14} /></div></div>
      </aside>

      <div className="main-shell">
        <header className="topbar"><div className="mobile-brand"><Menu size={20} /><strong>物语工坊</strong></div><div className="breadcrumb"><span>工作空间</span><span className="crumb-slash">/</span><strong>AI 图片工作台</strong></div><div className="topbar-right"><span className="version-pill"><span /> BETA 版</span><div className="avatar">S</div></div></header>
        <main className="content">
          <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> AI PRODUCT STORY STUDIO</div><h1>两张实拍，<br /><em>讲好产品的十个故事。</em></h1><p>一张让人一眼心动的主图，九张层层递进的副图。<br className="desktop-break" />让每个卖点，都成为消费者的生活理由。</p><div className="hero-meta"><div><span className="meta-icon"><UploadCloud size={18} /></span><strong>上传 2 张实拍</strong></div><span className="meta-line" /><div><span className="meta-icon"><Sparkles size={18} /></span><strong>生成 10 张宣传图</strong></div></div></div><div className="hero-art" aria-hidden="true"><div className="art-grid" /><div className="art-card art-back"><div className="art-orbit" /></div><div className="art-card art-front"><div className="art-glow" /><div className="art-product"><div className="product-top" /><div className="product-body" /><div className="product-base" /></div><span className="art-mini-label">ONE PRODUCT<br />TEN STORIES</span></div><div className="art-spark art-spark-one">✦</div><div className="art-spark art-spark-two">✧</div></div></section>

          <div className="workspace-grid"><section className="setup-column"><div className="section-heading"><div><span className="step-count">01</span><div><h2>提供产品素材</h2><p>两张不同角度的实拍，有助于还原产品细节</p></div></div><span className="heading-aside">支持 JPG / PNG / WebP</span></div><div className="upload-grid"><UploadSlot number={1} file={photos[0]} preview={previews[0]} onChange={(file) => setPhoto(0, file)} /><UploadSlot number={2} file={photos[1]} preview={previews[1]} onChange={(file) => setPhoto(1, file)} /></div><div className="upload-hint"><Check size={15} /><span>尽量使用清晰、无遮挡的实物照片，图片不会公开展示</span></div>

            <div className="separator" /><div className="section-heading second"><div><span className="step-count">02</span><div><h2>说说你的产品</h2><p>补充已确认的信息，让画面更贴近实际卖点</p></div></div><span className="optional-tag">选填</span></div><div className="field"><label htmlFor="productHint">产品名称 / 品类</label><input id="productHint" value={productHint} onChange={(event) => setProductHint(event.target.value)} maxLength={120} placeholder="例如：便携式咖啡杯" /></div><div className="field"><label htmlFor="sellingPoints">想突出的卖点</label><textarea id="sellingPoints" value={sellingPoints} onChange={(event) => setSellingPoints(event.target.value)} maxLength={300} placeholder="例如：轻巧易携带、杯盖密封、适合通勤使用…" rows={3} /><span className="field-note">仅填写真实、可验证的卖点；AI 也会参考上传图片。</span></div>

            <div className="separator" /><div className="section-heading second"><div><span className="step-count">03</span><div><h2>选择视觉风格</h2><p>统一主图与副图的视觉语言</p></div></div></div><div className="look-grid">{looks.map((look) => <button key={look.id} type="button" className={`look-card ${style === look.id ? "selected" : ""}`} onClick={() => setStyle(look.id)}><span className={`look-swatch ${look.swatch}`}><span /></span><strong>{look.label}</strong><small>{look.description}</small><span className="look-check"><Check size={12} /></span></button>)}</div>

            <div className="key-panel"><div className="key-panel-icon"><KeyRound size={18} /></div><div className="key-panel-body"><strong>图片生成密钥</strong>{serverKeyConfigured && !manualKeyMode ? <><p>检测到运行环境中的密钥，可以直接开始生成。</p><button type="button" className="key-switch" onClick={() => setManualKeyMode(true)}>改用自己的密钥</button></> : <><p>密钥仅用于向 OpenAI 发送请求，保留在本次页面，不写入电脑文件。</p><input type="password" autoComplete="off" spellCheck={false} value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="粘贴你的 API 密钥" aria-label="图片生成密钥" /><a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">如何获取 API 密钥 ↗</a>{serverKeyConfigured && <button type="button" className="key-switch" onClick={() => { setManualKeyMode(false); setApiKey(""); }}>使用环境中的密钥</button>}</>}</div></div>
            <div className="generate-area"><button className="generate-button" type="button" disabled={!photos[0] || !photos[1] || phase === "working" || ((!serverKeyConfigured || manualKeyMode) && !apiKey.trim())} onClick={generate}>{phase === "working" ? <LoaderCircle className="spin" size={21} /> : <Sparkles size={21} />}<span>{phase === "working" ? "正在创作中…" : phase === "done" ? "重新生成 10 张图片" : "开始生成 10 张宣传图"}</span><ArrowRight size={18} /></button>{phase === "working" && <button className="cancel-button" onClick={() => abortRef.current?.abort()}>停止生成</button>}<p>生成过程会调用图片模型并产生费用；每张图片完成后即显示。</p></div></section>

          <section className="story-column"><div className="story-top"><div><div className="eyebrow dark"><span className="eyebrow-line" /> YOUR VISUAL STORY</div><h2>一套图，<br />说清每一个心动理由<span>✳</span></h2><p>从第一眼的吸引，到细节、场景与情绪，<br />自动规划有节奏的十张产品故事图。</p></div><div className="story-number"><strong>1<span>+</span>9</strong><small>主图 + 副图</small></div></div><div className="story-progress"><div className="story-progress-top"><span>{phase === "idle" ? "即将开启你的视觉故事" : message}</span><strong>{completed} / 10</strong></div><div className="progress-track"><span style={{ width: `${completed * 10}%` }} /></div></div><div className="story-list">{shots.map((shot, index) => <div className={`story-row ${shot.src ? "ready" : ""} ${index === activeIndex ? "current" : ""}`} key={index}><div className={`story-thumb thumb-${index % 5}`}>{shot.src ? <img src={shot.src} alt={`${index === 0 ? "主图" : `副图 ${index}`}预览`} /> : <span>{index === 0 ? "✳" : String(index).padStart(2, "0")}</span>}</div><div className="story-row-content"><div className="story-row-label">{index === 0 ? "COVER · 主图" : `STORY ${String(index).padStart(2, "0")} · 副图`}</div><strong>{shot.title}</strong><span>{shot.subtitle}</span></div><div className="story-row-action">{shot.src ? <button type="button" title="下载这张图片" aria-label={`下载${index === 0 ? "主图" : `副图${index}`}`} disabled={exporting} onClick={() => downloadOne(index)}><ArrowDownToLine size={17} /></button> : index === activeIndex ? <LoaderCircle className="spin" size={17} /> : <ChevronDown size={17} />}</div></div>)}</div><div className="story-footer"><div><Package size={20} /><span>所有图片均以 1024 × 1024 PNG 导出，下载时自动加入中文文案。</span></div><button type="button" disabled={completed === 0 || exporting} onClick={downloadAll}>{exporting ? <LoaderCircle className="spin" size={17} /> : <ArrowDownToLine size={17} />}打包下载{completed > 0 ? ` (${completed})` : ""}</button></div>{(phase === "error" || phase === "cancelled") && <div className="error-panel"><RotateCcw size={17} /><span>{message} 已完成的图片仍可下载。</span></div>}</section></div>
          <footer className="page-footer"><span>© 2026 物语工坊 · 让好产品被看见</span><span>图片生成后，请核对产品外观与宣传文案是否准确。</span></footer>
        </main>
      </div>
    </div>
  );
}
