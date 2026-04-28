const KV_KEY = "school-survey-results-v2";

/** 서버·기기 간 중복 업로드 방지(동일 제출 지문) */
function resultFingerprint(entry) {
  if (!entry || typeof entry !== "object") return "";
  const role = String(entry.role ?? "");
  const submittedAt = String(entry.submittedAt ?? "");
  const responses =
    entry.responses && typeof entry.responses === "object" ? entry.responses : {};
  const keys = Object.keys(responses).sort();
  const tail = keys.map((k) => `${k}:${responses[k]}`).join("|");
  return `${role}\n${submittedAt}\n${tail}`;
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const h = cors();
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: h });
    }

    const url = new URL(request.url);
    const path = (url.pathname || "/").replace(/\/+$/, "") || "/";
    if (path !== "/results") {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { ...h, "Content-Type": "application/json" },
      });
    }

    if (request.method === "GET") {
      const raw = await env.SURVEY.get(KV_KEY);
      return new Response(raw || "[]", {
        headers: { ...h, "Content-Type": "application/json" },
      });
    }

    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "invalid json" }), {
          status: 400,
          headers: { ...h, "Content-Type": "application/json" },
        });
      }
      const raw = await env.SURVEY.get(KV_KEY);
      let arr;
      try {
        arr = JSON.parse(raw || "[]");
      } catch {
        arr = [];
      }
      if (!Array.isArray(arr)) arr = [];
      const fp = resultFingerprint(body);
      const exists = fp && arr.some((row) => resultFingerprint(row) === fp);
      if (exists) {
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
          headers: { ...h, "Content-Type": "application/json" },
        });
      }
      arr.push(body);
      await env.SURVEY.put(KV_KEY, JSON.stringify(arr));
      return new Response(JSON.stringify({ ok: true, duplicate: false }), {
        headers: { ...h, "Content-Type": "application/json" },
      });
    }

    if (request.method === "DELETE") {
      await env.SURVEY.put(KV_KEY, "[]");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...h, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...h, "Content-Type": "application/json" },
    });
  },
};
