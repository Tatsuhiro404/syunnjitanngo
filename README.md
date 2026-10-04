# 修改说明

## APK 隐藏安装入口修正版
- 普通网页版（电脑浏览器、手机浏览器、PWA）均保留“安装PC端／移动端”。
- 点击入口直接下载站点根目录 `/base.apk`。
- 只有官方 APK 内 ToApp WebView 隐藏该入口。
- APK 识别不依赖设备类型和 User-Agent（原 APK 会把 UA 设置成 Windows Chrome）。
- 识别方式同时支持 ToApp 的 `window.ToAppExport` Bridge 和 `window.__toappExportTrackerInstalled` 页面标记。
- 对 Bridge 延迟注入增加轮询，最长检测 10 秒。
- Service Worker 缓存升级到 v7。


## 新增功能：多语种导入 / AI 辅助导入 / 公共词库 / 限时模式

### 1. 开发者创建公共词库
登录开发者账号，在“快速导入”中选择“公共词库（仅开发者）”，输入新词库名称并点击“创建新的公共词库”。创建后即可直接导入。

### 2. 多语种导入格式
通用格式为：`外语词汇|中文词义`；有读音时使用：`外语词汇|读音|中文词义`。英语、韩语、法语、德语、西班牙语等不要求日语式读音字段。Excel/CSV/TSV/文本文件均可。

### 3. AI 辅助导入
开启“辅助导入模式”后，每行只填写一个外语词，例如：`apple`、`사과`、`bonjour`。网页会通过 Supabase Edge Function `translate-vocab` 自动补全中文词义，并先进入预览再导入。

AI 采用三级降级：
1. 先复用已经存在于词库中的相同词汇释义，不消耗 API token。
2. 调用 DeepSeek API。
3. DeepSeek 不可用或余额不足时，若配置了备用翻译服务，则自动切换备用服务；如果备用服务也不可用，则保留空释义，仍然允许进入预览并手动填写。

部署 Edge Function：
1. 部署 `supabase/functions/translate-vocab/index.ts`。
2. 在 Supabase Edge Function Secrets 中配置 `DEEPSEEK_API_KEY`。
3. 可选配置 `DEEPSEEK_TRANSLATE_MODEL`；未配置时使用 `deepseek-flash`。词义补全默认关闭 thinking 模式，以减少不必要的 token 消耗。
4. 推荐配置一个备用的 LibreTranslate 兼容服务：`FALLBACK_TRANSLATE_URL`，并按服务要求设置 `FALLBACK_TRANSLATE_API_KEY`。LibreTranslate 是开源翻译 API，也可自行部署；公共云端实例当前可能要求 API key。

DeepSeek Key 和备用翻译 Key 都只放在 Supabase 服务端，不写进 `config.js`。

### 4. 限时模式
主页“每组题量”下面新增“限时模式”，可选择 5s、10s、20s 或不限时。限时针对每道题的第一阶段识词环节；倒计时结束后自动显示词义，由用户继续选择“下一个”或“答错了”。
