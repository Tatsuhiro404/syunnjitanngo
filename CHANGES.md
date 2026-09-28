# 本次修改

## 安装入口

- `index.html` 中的按钮文字改为 `安装PC端／移动端`。
- 移除 `beforeinstallprompt` / PWA 原生安装流程。
- 桌面浏览器点击后下载站点根目录的 `base.apk`。

## 显示规则

- 桌面浏览器：显示安装入口。
- Android / iOS 移动端：隐藏安装入口。
- PWA standalone：隐藏安装入口。
- Android WebView / 当前 APK：隐藏安装入口。

## 缓存

- `sw.js` 缓存版本从 `v3` 升到 `v4`，让修改后的页面能更快替换旧缓存。

## APK

- `base.apk` 是本次收到的原始 APK，未修改其二进制内容；网页通过识别 WebView 环境实现 APK 内隐藏安装入口。

## 部署

`index.html` 和 `base.apk` 必须部署在同一站点根目录，使 `/base.apk` 能被访问。
