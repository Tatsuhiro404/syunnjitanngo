# 修改说明

## APK 隐藏安装入口修正版
- 普通网页版（电脑浏览器、手机浏览器、PWA）均保留“安装PC端／移动端”。
- 点击入口直接下载站点根目录 `/base.apk`。
- 只有官方 APK 内 ToApp WebView 隐藏该入口。
- APK 识别不依赖设备类型和 User-Agent（原 APK 会把 UA 设置成 Windows Chrome）。
- 识别方式同时支持 ToApp 的 `window.ToAppExport` Bridge 和 `window.__toappExportTrackerInstalled` 页面标记。
- 对 Bridge 延迟注入增加轮询，最长检测 10 秒。
- Service Worker 缓存升级到 v7。


## DeepSeek AI 辅助导入调整
- AI 服务由 OpenAI 改为 DeepSeek Chat Completions API。
- 主模型默认使用 `deepseek-flash`。
- 词义补全默认关闭 thinking，减少不必要的 reasoning token。
- 增加备用翻译服务降级链；DeepSeek 余额不足/请求失败时不会阻断普通导入。
- 预览释义改为可编辑，备用服务失败时可直接手动补全。
