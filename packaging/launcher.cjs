const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const root = __dirname;
const appDir = path.join(root, "app");
const serverFile = path.join(appDir, "server.js");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

function health(port) {
  return new Promise((resolve) => {
    const request = http.get({ hostname: "127.0.0.1", port, path: "/api/health", timeout: 1500 }, (response) => {
      let data = "";
      response.on("data", (chunk) => { data += chunk; });
      response.on("end", () => {
        try { resolve(response.statusCode === 200 && JSON.parse(data).ok === true); }
        catch { resolve(false); }
      });
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

function openBrowser(url) {
  if (process.env.STORY_STUDIO_NO_BROWSER === "1") return;
  if (process.platform === "win32") {
    spawn("cmd.exe", ["/d", "/s", "/c", `start "" "${url}"`], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
  } else {
    spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  }
}

async function main() {
  if (!fs.existsSync(serverFile)) throw new Error("网站文件不完整，请重新解压整个压缩包。");
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  console.log("正在启动物语工坊，请稍候…");
  const child = spawn(process.execPath, [serverFile], {
    cwd: appDir,
    env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1", NODE_USE_ENV_PROXY: "1" },
    stdio: "inherit",
  });
  let exited = false;
  child.once("exit", (code) => { exited = true; if (code && code !== 0) console.error(`网站进程退出：${code}`); });
  const stop = () => { if (!exited) child.kill(); process.exit(0); };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  for (let attempt = 0; attempt < 100; attempt++) {
    if (exited) throw new Error("网站启动失败，请查看上方错误信息。");
    if (await health(port)) {
      console.log(`工作台已启动：${url}`);
      console.log("浏览器将自动打开。保持此窗口开启；关闭窗口即可停止网站。");
      openBrowser(url);
      return;
    }
    await wait(300);
  }
  child.kill();
  throw new Error("启动超时。请检查安全软件是否阻止了本地网站。");
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
