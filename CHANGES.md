# 修改说明

- 登录页按钮名称改为「安装PC端／移动端」。
- 网页版（电脑浏览器、手机浏览器）均保留该按钮。
- 网页版点击按钮直接下载 `base.apk`，不再触发 PWA 安装。
- 仅当当前页面检测到 APK 内置的 `window.ToAppExport` JS Bridge 时隐藏按钮。
- 未使用 Android/iOS/桌面 UA 判断，因此普通手机浏览器不会被误隐藏。
- Service Worker 缓存版本升级为 v6。
