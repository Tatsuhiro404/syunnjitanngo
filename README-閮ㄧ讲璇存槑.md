# 瞬时日语：Netlify + Supabase 版

文件：
- `shunji-index-supabase.html`：改造后的主页面，部署时建议重命名为 `index.html`。
- `config.js`：填写 Supabase URL 与 anon public key。这里只能放 anon key，不能放 service_role key。
- `supabase-schema.sql`：Supabase 数据库、RLS、账号 profile、公共词库、个人词库、错词本、学习统计以及内置 329 条“日语专业四级”种子词的初始化脚本。

## 部署

1. 在 Supabase 新建项目。
2. 打开 SQL Editor，完整执行 `supabase-schema.sql`。
3. 在 Supabase Authentication 中使用 Email/Password 登录方式。当前网页为了实现“ID + Password”而不要求用户填写真实邮箱，会把 ID 映射为 `ID@shunshiriyu.app`。如果开启了 Confirm email，注册后需要按 Supabase 项目设置完成确认；为了纯 ID 登录体验，可在 Authentication 设置里关闭邮箱确认。
4. 从 Supabase 项目设置中取得 Project URL 和 anon public key，填写到 `config.js`。
5. 将 `shunji-index-supabase.html` 重命名为 `index.html`，并与 `config.js` 一起上传到 Netlify。
6. 注册一个账号后，在 Supabase SQL Editor 执行：

```sql
update public.profiles set role='admin' where username='你的开发者ID';
```

这个账号之后使用网页中的“开发者登录”。普通用户即使修改网页源代码，也不能绕过数据库 RLS 写入公共词库。

## 数据权限

公共词库：所有已登录用户可读，只有 `admin` 可新增/修改/删除。

个人词库：创建者可读写，其他用户不可见。

错词本与学习统计：按账号保存，因此在不同设备登录同一个 ID + Password 后会同步。
