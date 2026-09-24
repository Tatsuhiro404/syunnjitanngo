# 瞬時単語テスト PWA

这是一个基于 HTML + JavaScript + Supabase 的单页日语单词测试应用，已加入 PWA 支持。

## PWA 功能

- 可在支持 PWA 的浏览器中安装到手机主屏幕或电脑桌面。
- 安装后以独立 App 窗口运行，不显示普通浏览器标签栏。
- 使用 Service Worker 缓存应用基础文件，网络暂时中断时可以打开应用壳。
- 保留原有 Supabase 登录、词库、测试和学习记录功能。

## Zeabur 部署

本项目现在是纯前端静态项目，不需要 Node.js、Express、Netlify Function 或其他后端服务。

Zeabur 可以直接从 GitHub 部署静态网页；项目根目录存在 `index.html` 时会将其作为首页。部署后绑定 HTTPS 域名即可使用 PWA 安装功能。

如果你已经在 Zeabur 部署了这个 GitHub 仓库，只需要把更新后的文件推送到原仓库，Zeabur 会重新部署。

## 项目文件

- `index.html`：原有应用 + PWA 安装入口
- `manifest.webmanifest`：PWA 应用清单
- `sw.js`：Service Worker
- `icon-192.png` / `icon-512.png`：PWA 图标
- `apple-touch-icon.png`：iOS 主屏幕图标
- `config.js`：Supabase 配置
- `supabase-schema.sql`：原有数据库结构

## 用户如何安装

### Android / Chrome / Edge

打开应用网站，浏览器通常会显示“安装应用”或“添加到主屏幕”。应用首页也提供了安装按钮。

### iPhone / iPad

使用 Safari 打开网站 → 分享 → “添加到主屏幕”。

### 电脑

Chrome / Edge 等支持 PWA 的浏览器会在地址栏或应用菜单中提供安装选项。

注意：PWA 安装和 Service Worker 要求 HTTPS。Zeabur 绑定域名后使用 HTTPS 即可。
