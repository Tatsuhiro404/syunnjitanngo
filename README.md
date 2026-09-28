# 瞬時単語テスト Web + Android APK

这是纯静态网页版本，保留原有单词测试、Supabase 登录与 Edge TTS 功能。项目同时包含 Android APK。

## 本次修改

- 登录页按钮已从“＋ 安装到手机 / 桌面”改为“安装PC端／移动端”。
- 桌面浏览器点击该按钮时，不再调用 PWA 的 `beforeinstallprompt`，而是直接下载同目录下的 `base.apk`。
- Android 手机/平板浏览器、PWA standalone 模式以及 Android WebView（包括当前提供的 APK）不会显示该按钮。
- Service Worker 缓存版本已升级，避免旧版页面长期留在缓存中。

## 部署要求

将整个项目目录上传到同一个站点根目录，并确保 `base.apk` 与 `index.html` 位于同一级目录。

当前 APK 的网页地址来自：`https://shunshiriyu.zeabur.app/`。如果继续使用该地址部署，只需要把本压缩包中的 `base.apk` 一并放到站点根目录。

## APK 安装说明

桌面端按钮实际执行的是 APK 文件下载。Android 系统会按照浏览器/系统的安全策略处理 APK 下载与安装；网页不能在普通浏览器中静默绕过系统安装确认。

本版本没有修改 APK 本体。因为该 APK 是 WebView 壳应用，核心页面来自线上站点，所以网页端的移动/WebView 环境识别会在 APK 内生效。
