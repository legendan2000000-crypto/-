/* ════════════════════════════════════════════════════════
   국양이 서버

   · 무료: GEMINI_API_KEY   (신용카드 불필요)
   · 유료: ANTHROPIC_API_KEY (회사가 승인하면 나중에)
     → 있는 걸 자동으로 씁니다. 둘 다 있으면 Anthropic 우선.

   · AI_PRIVACY=strict (기본값)
     인사·급여·자가풀기·반입전송 코드는 AI에 보내지 않습니다.
     그 항목들은 [찾기] 탭에서만 보입니다.
     검색은 브라우저 안에서만 돌기 때문에 외부로 한 글자도 나가지 않습니다.
   ════════════════════════════════════════════════════════ */

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { KB, CHEATS, QUICKS } = require("./kb-base");

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY;
const ADMIN_PW = process.env.ADMIN_PASSWORD;
const STRICT = (process.env.AI_PRIVACY || "strict") === "strict";

const ENGINE = CLAUDE_KEY ? "claude" : GEMINI_KEY ? "gemini" : null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5-20251001";

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

/* ── 저장소 ── */
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const DEFAULT_DB = { cfg: { botName: "국양이", openMode: false }, entries: [], suggestions: [] };

const loadDb = () => {
  try {
    return { ...DEFAULT_DB, ...JSON.parse(fs.readFileSync(DB_FILE, "utf8")) };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DB));
  }
};
const saveDb = (d) => {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2));
};
let db = loadDb();
saveDb(db);

/* ── 관리자 ── */
const tokens = new Map();
const TTL = 12 * 60 * 60 * 1000;
const isAdmin = (req) => {
  const t = req.headers["x-admin-token"];
  if (!t) return false;
  const exp = tokens.get(t);
  if (!exp || Date.now() > exp) {
    tokens.delete(t);
    return false;
  }
  return true;
};
const needAdmin = (req, res, next) =>
  isAdmin(req) ? next() : res.status(403).json({ error: "관리자만 가능합니다" });

const tries = new Map();
const tooMany = (ip) => {
  const t = tries.get(ip);
  if (!t) return false;
  if (Date.now() - t.at > 600000) {
    tries.delete(ip);
    return false;
  }
  return t.n >= 8;
};

/* ════ API ════ */

app.get("/api/base", (_q, res) => {
  res.json({ KB, CHEATS, QUICKS, chatEnabled: !!ENGINE, strict: STRICT });
});

app.get("/api/state", (req, res) => {
  const a = isAdmin(req);
  res.json({ cfg: db.cfg, entries: db.entries, suggestions: a ? db.suggestions : [], isAdmin: a });
});

app.post("/api/login", (req, res) => {
  const ip = req.ip || "?";
  if (tooMany(ip)) return res.status(429).json({ error: "시도가 너무 많습니다. 10분 뒤 다시" });
  if (!ADMIN_PW) return res.status(500).json({ error: "서버에 관리자 암호가 없습니다" });
  const pw = String(req.body?.password || "");
  const ok =
    pw.length === ADMIN_PW.length &&
    crypto.timingSafeEqual(Buffer.from(pw), Buffer.from(ADMIN_PW));
  if (!ok) {
    const t = tries.get(ip) || { n: 0 };
    tries.set(ip, { n: t.n + 1, at: Date.now() });
    return res.status(401).json({ error: "암호가 맞지 않습니다" });
  }
  tries.delete(ip);
  const token = crypto.randomBytes(24).toString("hex");
  tokens.set(token, Date.now() + TTL);
  res.json({ token });
});

app.post("/api/kb", (req, res) => {
  const title = String(req.body?.title || "").trim().slice(0, 200);
  const body = String(req.body?.body || "").trim().slice(0, 8000);
  const who = String(req.body?.who || "").trim().slice(0, 40) || "익명";
  if (!title || !body) return res.status(400).json({ error: "제목과 내용을 넣어주세요" });
  const item = {
    id: crypto.randomBytes(6).toString("hex"),
    title,
    body,
    who,
    at: new Date().toISOString().slice(0, 10),
  };
  const direct = isAdmin(req) || db.cfg.openMode;
  (direct ? db.entries : db.suggestions).unshift(item);
  saveDb(db);
  res.json({ ok: true, direct });
});

app.post("/api/kb/approve", needAdmin, (req, res) => {
  const s = db.suggestions.find((x) => x.id === req.body?.id);
  if (!s) return res.status(404).json({ error: "없는 제안입니다" });
  db.entries.unshift(s);
  db.suggestions = db.suggestions.filter((x) => x.id !== s.id);
  saveDb(db);
  res.json({ ok: true });
});
app.post("/api/kb/reject", needAdmin, (req, res) => {
  db.suggestions = db.suggestions.filter((x) => x.id !== req.body?.id);
  saveDb(db);
  res.json({ ok: true });
});
app.post("/api/kb/delete", needAdmin, (req, res) => {
  db.entries = db.entries.filter((x) => x.id !== req.body?.id);
  saveDb(db);
  res.json({ ok: true });
});
app.post("/api/config", needAdmin, (req, res) => {
  if (typeof req.body?.botName === "string" && req.body.botName.trim())
    db.cfg.botName = req.body.botName.trim().slice(0, 30);
  if (typeof req.body?.openMode === "boolean") db.cfg.openMode = req.body.openMode;
  saveDb(db);
  res.json({ ok: true, cfg: db.cfg });
});

/* ── 시스템 프롬프트 ── */
function systemPrompt() {
  const pool = STRICT ? KB.filter((x) => !x.s) : KB;
  const raw = pool.map((x) => `■ ${x.t}\n${x.b}`).join("\n\n");
  const add = db.entries.length
    ? "\n\n[사내 추가 지식 — 관리자 승인분. 기본 지식과 충돌하면 이쪽을 우선한다]\n" +
      db.entries.map((e) => `● ${e.title}\n${e.body}`).join("\n\n")
    : "";
  const guard = STRICT
    ? `
[다루지 않는 주제 — 중요]
인사·급여·연차·경조휴가·복리후생, 선사별 자가풀기 서류, 반입전송 코드는
이 대화에서 다루지 않는다. 그런 질문을 받으면 이렇게만 답한다:
"그건 사내 정보라 대화로는 안 알려드려요. 위쪽 [찾기] 탭에서 검색하시면 다 나옵니다."
절대 지어내서 답하지 말 것.
`
    : "";
  return `너는 "${db.cfg.botName}", 국양로지텍(주)의 사내 물류 챗봇이다. 신입사원과 현장 배차 OP가 주로 쓴다.

[말투]
· 옆자리 3년차 선배처럼 편하게, 그러나 정확하게. 존댓말.
· 보고서 말투("~에 해당합니다") 대신 "이건 구즈넥 쓰셔야 해요"처럼 말한다.
· 먼저 짧게 답한다. 한 줄로 끝나면 한 줄로 끝낸다.
· 캐물으면 그때 깊게 파고든다. 숫자·코드는 **굵게**.
· "~더 자세히 알려드릴까요?" 같은 상투적 마무리는 붙이지 않는다.

[규칙]
· 지식베이스에 없으면 지어내지 말고 "그건 자료에 없어요. 담당자한테 확인해 보세요"라고 답한다.
· 과적·중량·보세 경고(⚠)는 절대 빼먹지 않는다. 사람이 다치거나 벌금 나오는 문제다.
· INCOTERMS는 무조건 2020 기준. DDU·DAT는 폐지된 구조건.
· 과적 법령은 현행 도로법 제77조·제114조·제117조 기준.
· 터미널·선사 정책은 자주 바뀌므로 최종 확인을 권한다.

[보안 — 예외 없음]
계정 ID, 비밀번호, 인증서 비밀번호, 계좌번호, 카드번호는 절대 알려주지 않는다.
"그건 보안이라 제가 못 알려드려요. 관리자한테 문의하세요"라고만 답한다.
절차 안내는 평소대로 다 알려준다.
${guard}
[지식베이스]
${raw}${add}`;
}

/* ── 모델 호출 ── */
async function askGemini(system, msgs) {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    GEMINI_MODEL +
    ":generateContent?key=" +
    GEMINI_KEY;
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: msgs.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content || "").slice(0, 4000) }],
      })),
      generationConfig: { maxOutputTokens: 1200, temperature: 0.4 },
    }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || "Gemini 오류");
  return (d.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
}

async function askClaude(system, msgs) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": CLAUDE_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1200,
      system,
      messages: msgs.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || "").slice(0, 4000),
      })),
    }),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || "Claude 오류");
  return (d.content || []).map((c) => (c.type === "text" ? c.text : "")).join("\n");
}

const hits = new Map();
app.post("/api/chat", async (req, res) => {
  if (!ENGINE)
    return res.status(503).json({ error: "서버에 API 키가 없습니다. 관리자에게 문의하세요." });

  const ip = req.ip || "?";
  const now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 60000);
  if (h.length >= 8)
    return res.status(429).json({ error: "잠깐만요. 1분 뒤에 다시 물어봐 주세요." });
  h.push(now);
  hits.set(ip, h);

  const msgs = Array.isArray(req.body?.messages) ? req.body.messages.slice(-16) : [];
  if (!msgs.length) return res.status(400).json({ error: "질문이 비어 있습니다" });

  try {
    const sys = systemPrompt();
    const text = ENGINE === "claude" ? await askClaude(sys, msgs) : await askGemini(sys, msgs);
    res.json({ text: text || "답을 못 만들었어요. 다시 물어봐 주세요." });
  } catch (e) {
    console.error("chat error:", e.message);
    const quota = /quota|rate|429|exhaust/i.test(e.message);
    res.status(500).json({
      error: quota
        ? "오늘 무료 사용량을 다 썼어요. [찾기] 탭은 그대로 쓰실 수 있습니다."
        : "답변을 가져오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    });
  }
});

app.listen(PORT, () => {
  const eng = !ENGINE
    ? "없음 — 대화 꺼짐"
    : ENGINE === "claude"
    ? "Claude " + CLAUDE_MODEL
    : "Gemini " + GEMINI_MODEL + " (무료)";
  console.log("\n  국양이  →  http://localhost:" + PORT);
  console.log("  엔진      : " + eng);
  console.log("  민감정보  : " + (STRICT ? "AI에 안 보냄 (검색 전용)" : "전부 AI에 보냄"));
  console.log("  관리자    : " + (ADMIN_PW ? "설정됨" : "없음") + "\n");
});
