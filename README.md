# 修改说明

## APK 隐藏安装入口修正版
- 普通网页版（电脑浏览器、手机浏览器、PWA）均保留“安装PC端／移动端”。
- 点击入口直接下载站点根目录 `/base.apk`。
- 只有官方 APK 内 ToApp WebView 隐藏该入口。
- APK 识别不依赖设备类型和 User-Agent（原 APK 会把 UA 设置成 Windows Chrome）。
- 识别方式同时支持 ToApp 的 `window.ToAppExport` Bridge 和 `window.__toappExportTrackerInstalled` 页面标记。
- 对 Bridge 延迟注入增加轮询，最长检测 10 秒。
- Service Worker 缓存升级到 v7。
