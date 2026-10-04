import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

type VocabItem = { index: number; word: string };
type ResultItem = { index: number; meaning: string; source: "deepseek" | "fallback" | "untranslated" };

const LANG_NAMES: Record<string, string> = {
  auto: "自动识别",
  en: "英语",
  ko: "韩语",
  fr: "法语",
  ja: "日语",
  de: "德语",
  es: "西班牙语",
  zh: "中文",
  other: "其他语种",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: cors });
}

function stripJsonFence(value: string) {
  return String(value || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function languageCode(language: string) {
  const map: Record<string, string> = {
    auto: "auto",
    en: "en",
    ko: "ko",
    fr: "fr",
    ja: "ja",
    de: "de",
    es: "es",
    zh: "zh",
  };
  return map[language] || "auto";
}

async function translateByDeepSeek(language: string, items: VocabItem[]): Promise<ResultItem[]> {
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!apiKey) throw new Error("服务端未配置 DEEPSEEK_API_KEY");

  // 当前 DeepSeek 官方文档推荐的通用模型名。
  const model = Deno.env.get("DEEPSEEK_TRANSLATE_MODEL") || "deepseek-flash";
  const prompt = [
    "你是多语种学习词库的中文释义助手。",
    `输入语言：${LANG_NAMES[language] || "自动识别"}`,
    "请把每个外语词汇转换成适合中文学习者使用的简洁中文词义。",
    "要求：",
    "1. 保持 index 完全不变；",
    "2. meaning 只填写中文词义，不写解释、例句、音标或额外前缀；",
    "3. 一个词有多个常见义项时，用“；”分隔；",
    "4. 不要遗漏任何输入项；",
    "5. 输出必须是 JSON object，结构为 {\"items\":[{\"index\":0,\"meaning\":\"...\"}]}。",
    `输入：${JSON.stringify(items)}`,
  ].join("\n");

  const r = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "你只负责严格、准确地生成词库中文释义。" },
        { role: "user", content: prompt },
      ],
      stream: false,
      response_format: { type: "json_object" },
      // 词义补全不需要深度推理，关闭 thinking 可避免产生额外 reasoning token。
      thinking: { type: "disabled" },
      max_tokens: Math.max(256, items.length * 32),
    }),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detail = data?.error?.message || `DeepSeek 请求失败（HTTP ${r.status}）`;
    const err = new Error(detail);
    (err as any).status = r.status;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek 未返回有效内容");

  const parsed = JSON.parse(stripJsonFence(content));
  if (!parsed || !Array.isArray(parsed.items)) throw new Error("DeepSeek 返回格式错误");

  const out: ResultItem[] = [];
  for (const item of parsed.items) {
    const index = Number(item?.index);
    const meaning = String(item?.meaning || "").trim();
    if (Number.isInteger(index) && meaning) out.push({ index, meaning, source: "deepseek" });
  }
  return out;
}

async function translateOneByLibreTranslate(baseUrl: string, apiKey: string, language: string, word: string) {
  const r = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-API-Key": apiKey } : {}),
    },
    body: JSON.stringify({
      q: word,
      source: languageCode(language),
      target: "zh",
      format: "text",
      ...(apiKey ? { api_key: apiKey } : {}),
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `备用翻译失败（HTTP ${r.status}）`);
  return String(data?.translatedText || "").trim();
}

async function translateByFallback(language: string, items: VocabItem[]): Promise<ResultItem[]> {
  const baseUrl = Deno.env.get("FALLBACK_TRANSLATE_URL");
  if (!baseUrl) return [];
  const apiKey = Deno.env.get("FALLBACK_TRANSLATE_API_KEY") || "";

  const results: ResultItem[] = [];
  // 控制并发，避免备用翻译服务被一次性打爆。
  for (let i = 0; i < items.length; i += 4) {
    const group = items.slice(i, i + 4);
    const settled = await Promise.allSettled(
      group.map(async (item) => ({
        ...item,
        meaning: await translateOneByLibreTranslate(baseUrl, apiKey, language, item.word),
      })),
    );
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value.meaning) {
        results.push({ index: s.value.index, meaning: s.value.meaning, source: "fallback" });
      }
    }
  }
  return results;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "未登录" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Supabase 环境变量未配置");

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "登录状态无效" }, 401);

    const { language = "auto", items = [] } = await req.json();
    if (!Array.isArray(items) || !items.length) return json({ items: [], provider: "none" });

    const clean: VocabItem[] = items
      .map((x: any) => ({ index: Number(x?.index), word: String(x?.word || "").trim() }))
      .filter((x: VocabItem) => Number.isInteger(x.index) && x.word);

    const finalMap = new Map<number, ResultItem>();
    let provider: "deepseek" | "fallback" | "mixed" | "manual" = "deepseek";

    // 1) 主服务：DeepSeek
    let deepSeekError: unknown = null;
    try {
      const ds = await translateByDeepSeek(language, clean);
      for (const x of ds) finalMap.set(x.index, x);
    } catch (e) {
      deepSeekError = e;
    }

    // 2) DeepSeek 失败/漏项时，尝试备用翻译服务。
    const missing = clean.filter((x) => !finalMap.has(x.index));
    if (missing.length) {
      try {
        const fb = await translateByFallback(language, missing);
        for (const x of fb) finalMap.set(x.index, x);
        if (fb.length) provider = finalMap.size < clean.length ? "mixed" : "fallback";
      } catch (_) {
        // 备用服务不可用时继续走人工兜底，不让整个导入中断。
      }
    }

    // 3) 最终人工兜底：返回空释义，前端仍可进入预览并手动补全后导入。
    const output: ResultItem[] = clean.map((x) => {
      const hit = finalMap.get(x.index);
      return hit || { index: x.index, meaning: "", source: "untranslated" };
    });

    const untranslated = output.filter((x) => !x.meaning).length;
    if (untranslated) provider = provider === "deepseek" ? "manual" : provider;

    return json({
      items: output,
      provider,
      fallbackConfigured: Boolean(Deno.env.get("FALLBACK_TRANSLATE_URL")),
      deepSeekError: deepSeekError ? String((deepSeekError as Error)?.message || deepSeekError) : null,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
