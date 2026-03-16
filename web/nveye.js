// NvEye V7 - ComfyUI 硬體監控
// 在介面右下角顯示硬體狀態

import { app } from "../../scripts/app.js";

// ============================================================
// 多語言
// ============================================================
const LANGS = {
    "zh-TW": {
        title:    "NvEye 硬體監控",
        gpu:      "GPU使用率",
        vram:     "VRAM使用率",
        temp:     "顯卡溫度",
        cpu:      "CPU使用率",
        ram:      "RAM使用率",
        minimize: "縮小",
        mini:     "👁 NvEye",
        lang:     "切換語言",
        langs:    ["繁體中文", "English", "日本語", "한국어"],
    },
    "en": {
        title:    "NvEye Monitor",
        gpu:      "GPU Usage",
        vram:     "VRAM Usage",
        temp:     "GPU Temp",
        cpu:      "CPU Usage",
        ram:      "RAM Usage",
        minimize: "Minimize",
        mini:     "👁 NvEye",
        lang:     "Language",
        langs:    ["繁體中文", "English", "日本語", "한국어"],
    },
    "ja": {
        title:    "NvEye モニター",
        gpu:      "GPU使用率",
        vram:     "VRAM使用率",
        temp:     "GPU温度",
        cpu:      "CPU使用率",
        ram:      "RAM使用率",
        minimize: "最小化",
        mini:     "👁 NvEye",
        lang:     "言語切替",
        langs:    ["繁體中文", "English", "日本語", "한국어"],
    },
    "ko": {
        title:    "NvEye 모니터",
        gpu:      "GPU 사용률",
        vram:     "VRAM 사용률",
        temp:     "GPU 온도",
        cpu:      "CPU 사용률",
        ram:      "RAM 사용률",
        minimize: "최소화",
        mini:     "👁 NvEye",
        lang:     "언어 변경",
        langs:    ["繁體中文", "English", "日本語", "한국어"],
    },
};

const LANG_KEYS = ["zh-TW", "en", "ja", "ko"];

function detectLang() {
    const saved = localStorage.getItem("nveye-lang");
    if (saved && LANGS[saved]) return saved;
    const nav = navigator.language;
    if (nav.startsWith("zh-TW") || nav.startsWith("zh-HK")) return "zh-TW";
    if (nav.startsWith("ja")) return "ja";
    if (nav.startsWith("ko")) return "ko";
    return "en";
}

let currentLang = detectLang();
function t() { return LANGS[currentLang]; }

// ============================================================
// 顏色判斷
// ============================================================
function getUtilColor(val) {
    if (val >= 76) return "#ff4646";
    if (val >= 51) return "#ff8c1e";
    if (val >= 26) return "#f0dc32";
    return "#50dc64";
}

function getTempColor(temp) {
    if (temp >= 86) return "#ff4646";
    if (temp >= 71) return "#ff8c1e";
    if (temp >= 51) return "#f0dc32";
    return "#50dc64";
}

// ============================================================
// 建立 UI
// ============================================================
function createNvEyeWidget() {
    // 主容器
    const container = document.createElement("div");
    container.id = "nveye-container";
    container.style.cssText = `
        position: fixed;
        bottom: 40px;
        right: 20px;
        background: rgba(20, 20, 20, 0.92);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        padding: 12px 16px;
        font-family: 'Consolas', monospace;
        font-size: 12px;
        color: #aaa;
        z-index: 9999;
        min-width: 260px;
        backdrop-filter: blur(6px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        user-select: none;
        cursor: move;
        transition: opacity 0.2s;
    `;

    // 標題列
    const titleBar = document.createElement("div");
    titleBar.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    `;

    const gpuName = document.createElement("span");
    gpuName.id = "nveye-gpu-name";
    gpuName.style.cssText = `color: #ddd; font-weight: bold; font-size: 12px;`;
    gpuName.textContent = t().title;

    // 縮小按鈕
    const toggleBtn = document.createElement("span");
    toggleBtn.textContent = "－";
    toggleBtn.title = t().minimize;
    toggleBtn.style.cssText = `
        cursor: pointer;
        color: #888;
        font-size: 14px;
        line-height: 1;
        padding: 0 4px;
        border-radius: 4px;
        transition: color 0.2s;
    `;
    toggleBtn.onmouseover = () => toggleBtn.style.color = "#fff";
    toggleBtn.onmouseout = () => toggleBtn.style.color = "#888";

    titleBar.appendChild(gpuName);
    titleBar.appendChild(toggleBtn);
    container.appendChild(titleBar);

    // 內容區
    const content = document.createElement("div");
    content.id = "nveye-content";

    function makeRow(labelText, id) {
        const row = document.createElement("div");
        row.style.cssText = `display: flex; justify-content: space-between; margin: 3px 0;`;
        const label = document.createElement("span");
        label.textContent = labelText;
        label.style.color = "#888";
        const value = document.createElement("span");
        value.id = id;
        value.style.color = "#50dc64";
        row.appendChild(label);
        row.appendChild(value);
        return row;
    }

    content.appendChild(makeRow(t().gpu,  "nveye-gpu-util"));
    content.appendChild(makeRow(t().vram, "nveye-vram"));
    content.appendChild(makeRow(t().temp, "nveye-temp"));

    // 分隔線
    const sep = document.createElement("div");
    sep.style.cssText = `border-top: 1px solid rgba(255,255,255,0.08); margin: 6px 0;`;
    content.appendChild(sep);

    content.appendChild(makeRow(t().cpu, "nveye-cpu"));
    content.appendChild(makeRow(t().ram, "nveye-ram"));

    container.appendChild(content);

    // 縮小圖示（收合時顯示）
    const miniIcon = document.createElement("div");
    miniIcon.id = "nveye-mini";
    miniIcon.style.cssText = `
        position: fixed;
        bottom: 40px;
        right: 20px;
        background: rgba(20, 20, 20, 0.92);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 6px 10px;
        font-family: 'Consolas', monospace;
        font-size: 11px;
        color: #aaa;
        z-index: 9999;
        cursor: pointer;
        display: none;
        backdrop-filter: blur(6px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    `;
    miniIcon.textContent = t().mini;
    miniIcon.title = "點擊展開";

    // 語言切換函數
    function applyLang() {
        currentLang = detectLang();
        const l = t();
        miniIcon.textContent = l.mini;
        toggleBtn.title = l.minimize;
        // 更新標籤文字
        const rows = content.querySelectorAll("div");
        const keys = [l.gpu, l.vram, l.temp, null, l.cpu, l.ram];
        let ri = 0;
        rows.forEach(row => {
            if (keys[ri] === null) { ri++; return; }
            if (keys[ri]) {
                const label = row.querySelector("span:first-child");
                if (label) label.textContent = keys[ri];
                ri++;
            }
        });
    }

    // 右鍵語言選單
    container.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const existing = document.getElementById("nveye-lang-menu");
        if (existing) existing.remove();

        const menu = document.createElement("div");
        menu.id = "nveye-lang-menu";
        menu.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            background: rgba(30,30,30,0.97);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 8px;
            padding: 4px 0;
            z-index: 99999;
            font-family: Consolas, monospace;
            font-size: 12px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            min-width: 130px;
        `;

        // 標題
        const menuTitle = document.createElement("div");
        menuTitle.textContent = t().lang;
        menuTitle.style.cssText = `color:#888; padding:6px 14px 4px; font-size:11px; border-bottom:1px solid rgba(255,255,255,0.08); margin-bottom:2px;`;
        menu.appendChild(menuTitle);

        LANG_KEYS.forEach((key, i) => {
            const item = document.createElement("div");
            item.textContent = (key === currentLang ? "✓ " : "  ") + t().langs[i];
            item.style.cssText = `
                padding: 6px 14px;
                cursor: pointer;
                color: ${key === currentLang ? "#fff" : "#aaa"};
                transition: background 0.1s;
            `;
            item.onmouseover = () => item.style.background = "rgba(255,255,255,0.08)";
            item.onmouseout = () => item.style.background = "transparent";
            item.onclick = () => {
                currentLang = key;
                localStorage.setItem("nveye-lang", key);
                applyLang();
                menu.remove();
            };
            menu.appendChild(item);
        });

        document.body.appendChild(menu);
        setTimeout(() => document.addEventListener("click", () => menu.remove(), { once: true }), 0);
    });

    // 縮小/展開邏輯
    let collapsed = false;
    toggleBtn.onclick = () => {
        collapsed = true;
        container.style.display = "none";
        miniIcon.style.display = "block";
    };
    miniIcon.onclick = () => {
        collapsed = false;
        container.style.display = "block";
        miniIcon.style.display = "none";
    };

    // 拖曳功能
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    container.addEventListener("mousedown", (e) => {
        if (e.target === toggleBtn) return;
        isDragging = true;
        dragOffsetX = e.clientX - container.getBoundingClientRect().left;
        dragOffsetY = e.clientY - container.getBoundingClientRect().top;
        container.style.transition = "none";
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        const x = e.clientX - dragOffsetX;
        const y = e.clientY - dragOffsetY;
        container.style.right = "auto";
        container.style.bottom = "auto";
        container.style.left = x + "px";
        container.style.top = y + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        container.style.transition = "opacity 0.2s";
    });
    let miniDragging = false;
    let miniOffsetX = 0;
    let miniOffsetY = 0;

    miniIcon.addEventListener("mousedown", (e) => {
        miniDragging = true;
        miniOffsetX = e.clientX - miniIcon.getBoundingClientRect().left;
        miniOffsetY = e.clientY - miniIcon.getBoundingClientRect().top;
        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!miniDragging) return;
        miniIcon.style.right = "auto";
        miniIcon.style.bottom = "auto";
        miniIcon.style.left = (e.clientX - miniOffsetX) + "px";
        miniIcon.style.top = (e.clientY - miniOffsetY) + "px";
    });

    document.addEventListener("mouseup", () => {
        miniDragging = false;
    });

    document.body.appendChild(container);
    document.body.appendChild(miniIcon);

    return { container, miniIcon };
}

// ============================================================
// 更新數據
// ============================================================
function updateStats() {
    fetch("/nveye/stats")
        .then(r => r.json())
        .then(d => {
            const el = (id) => document.getElementById(id);
            if (!el("nveye-gpu-util")) return;

            el("nveye-gpu-name").textContent = d.gpu_name || "NvEye";

            el("nveye-gpu-util").textContent = `${d.gpu_util}%`;
            el("nveye-gpu-util").style.color = getUtilColor(d.gpu_util);

            el("nveye-vram").textContent = `${d.mem_used}G / ${d.mem_total}G (${d.mem_pct}%)`;
            el("nveye-vram").style.color = getUtilColor(d.mem_pct);

            el("nveye-temp").textContent = `${d.temp}°C`;
            el("nveye-temp").style.color = getTempColor(d.temp);

            el("nveye-cpu").textContent = `${d.cpu_util}%`;
            el("nveye-cpu").style.color = getUtilColor(d.cpu_util);

            el("nveye-ram").textContent = `${d.ram_used}G / ${d.ram_total}G (${d.ram_pct}%)`;
            el("nveye-ram").style.color = getUtilColor(d.ram_pct);
        })
        .catch(() => {});
}

// ============================================================
// 初始化
// ============================================================
app.registerExtension({
    name: "NvEye.HardwareMonitor",
    async setup() {
        createNvEyeWidget();
        setInterval(updateStats, 1000);
        console.log("[NvEye] 硬體監控已載入 ✓");
    }
});
