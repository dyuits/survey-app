const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const passwordInput = document.getElementById("passwordInput");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const statsContent = document.getElementById("statsContent");
const clearAllButton = document.getElementById("clearAllButton");
const chartTypeSelect = document.getElementById("chartTypeSelect");
const downloadCsvButton = document.getElementById("downloadCsvButton");
const refreshStatsButton = document.getElementById("refreshStatsButton");
const storageHint = document.getElementById("storageHint");
const SCALE_LABELS = ["매우 아니다", "아니다", "보통", "그렇다", "매우 그렇다"];
const SCALE_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#2563eb"];

let currentAllResults = [];

function showQuestionPopup(roleId, qIndex) {
  const config = ROLE_CONFIG[roleId];
  const items = currentAllResults.filter((row) => row.role === roleId);
  let num = 0;
  let targetQ = null;
  for (const cat of config.categories) {
    for (let i = 0; i < cat.questions.length; i++) {
      if (num === qIndex) {
        const qId = `${cat.id}-${i + 1}`;
        const dist = [0, 0, 0, 0, 0];
        items.forEach((e) => {
          const v = Number(e.responses[qId] || 0);
          if (v >= 1 && v <= 5) dist[v - 1]++;
        });
        targetQ = { num: num + 1, text: cat.questions[i], dist, total: items.length, categoryName: cat.name };
        break;
      }
      num++;
    }
    if (targetQ) break;
  }
  if (!targetQ) return;

  const existing = document.getElementById("questionPopup");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "questionPopup";
  overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;";
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const maxCount = Math.max(1, ...targetQ.dist);
  const barsHtml = SCALE_LABELS.map((label, idx) => {
    const count = targetQ.dist[idx];
    const pct = targetQ.total > 0 ? Math.round(count / targetQ.total * 100) : 0;
    const barWidth = Math.round(count / maxCount * 100);
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="min-width:90px;font-size:14px;text-align:right;">${label}</span>
      <div style="flex:1;background:#e5e7eb;border-radius:6px;height:28px;overflow:hidden;">
        <div style="width:${barWidth}%;height:100%;background:${SCALE_COLORS[idx]};border-radius:6px;transition:width 0.3s;"></div>
      </div>
      <span style="min-width:70px;font-size:14px;">${count}명 (${pct}%)</span>
    </div>`;
  }).join("");

  const popup = document.createElement("div");
  popup.style.cssText = "background:#fff;border-radius:12px;padding:24px;max-width:500px;width:100%;box-shadow:0 8px 30px rgba(0,0,0,0.2);";
  popup.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px;">
      <div>
        <span style="font-size:12px;color:#6b7280;">${targetQ.categoryName}</span>
        <h3 style="margin:4px 0 0;font-size:16px;">${targetQ.num}번. ${targetQ.text}</h3>
      </div>
      <button id="popupClose" style="background:none;border:none;font-size:24px;cursor:pointer;color:#9ca3af;padding:0 4px;">&times;</button>
    </div>
    <p style="font-size:13px;color:#6b7280;margin-bottom:12px;">응답 ${targetQ.total}건</p>
    ${barsHtml}
  `;
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
  popup.querySelector("#popupClose").addEventListener("click", () => overlay.remove());
}

function setStorageHintText() {
  if (!storageHint) return;
  storageHint.textContent = hasRemoteApi()
    ? "서버에 응답이 저장됩니다. 새로고침으로 최신 통계를 불러올 수 있습니다. 이 브라우저에만 남아 있던 예전 제출은, 이 페이지에 들어올 때 자동으로 서버로 옮깁니다(아직 데이터를 지우지 않았다면)."
    : "지금은 이 브라우저에만 응답이 쌓입니다. 학생·교사·학부모 기기 응답을 관리자에서 보려면 api-config.js의 SURVEY_API_BASE에 공통 API 주소를 넣고 GitHub Pages에 반영하세요. (저장소의 worker 폴더 참고)";
}

async function tryLogin() {
  const value = passwordInput.value.trim();
  if (value !== ADMIN_PASSWORD) {
    loginMessage.textContent = "비밀번호가 올바르지 않습니다.";
    return;
  }
  loginMessage.textContent = "";
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  setStorageHintText();
  await migrateLocalResultsToRemote();
  await renderStats();
}

function calcAverage(entries, questionIds) {
  if (entries.length === 0) return 0;
  let sum = 0;
  let count = 0;
  entries.forEach((entry) => {
    questionIds.forEach((id) => {
      sum += Number(entry.responses[id] || 0);
      count += 1;
    });
  });
  return count === 0 ? 0 : sum / count;
}

function calcQuestionAvg(entries, qId) {
  if (entries.length === 0) return 0;
  let sum = 0;
  entries.forEach((e) => { sum += Number(e.responses[qId] || 0); });
  return sum / entries.length;
}

function makeRoleStats(roleId, allResults) {
  const config = ROLE_CONFIG[roleId];
  const items = allResults.filter((row) => row.role === roleId);
  const categoryA = config.categories[0];
  const categoryB = config.categories[1];
  const idsA = categoryA.questions.map((_, i) => `${categoryA.id}-${i + 1}`);
  const idsB = categoryB.questions.map((_, i) => `${categoryB.id}-${i + 1}`);
  const totalIds = [...idsA, ...idsB];

  const questionStats = [];
  let num = 1;
  config.categories.forEach((cat) => {
    cat.questions.forEach((text, i) => {
      const qId = `${cat.id}-${i + 1}`;
      const avg = calcQuestionAvg(items, qId);
      const dist = [0, 0, 0, 0, 0];
      items.forEach((e) => {
        const v = Number(e.responses[qId] || 0);
        if (v >= 1 && v <= 5) dist[v - 1]++;
      });
      questionStats.push({ num, text, avg, categoryName: cat.name, categoryId: cat.id, qId, dist, total: items.length });
      num++;
    });
  });

  return {
    count: items.length,
    avgA: calcAverage(items, idsA),
    avgB: calcAverage(items, idsB),
    avgTotal: calcAverage(items, totalIds),
    labelA: categoryA.name,
    labelB: categoryB.name,
    questionStats,
  };
}

let chartType = "bar";

function paintStats(allResults) {
  currentAllResults = allResults;
  statsContent.innerHTML = "";

  const totalBox = document.createElement("div");
  totalBox.className = "stats-card";
  totalBox.innerHTML = `<h3 class="stats-title">전체 제출 건수</h3><p class="kpi-value">${allResults.length}건</p>`;
  statsContent.appendChild(totalBox);

  const roleStats = [];
  Object.keys(ROLE_CONFIG).forEach((roleId) => {
    const role = ROLE_CONFIG[roleId];
    const stat = makeRoleStats(roleId, allResults);
    roleStats.push({ role, stat });

    const card = document.createElement("div");
    card.className = "stats-card";
    const chartHtml =
      chartType === "pie"
        ? renderPieChart(stat)
        : renderBarChart(stat);

    card.innerHTML = `
      <h3 class="stats-title">${role.name}</h3>
      <div class="stats-grid">
        <div class="kpi"><p class="kpi-label">응답 건수</p><p class="kpi-value">${stat.count}건</p></div>
        <div class="kpi"><p class="kpi-label">${stat.labelA} 평균</p><p class="kpi-value">${Math.round(stat.avgA / 5 * 100)}%</p></div>
        <div class="kpi"><p class="kpi-label">${stat.labelB} 평균</p><p class="kpi-value">${Math.round(stat.avgB / 5 * 100)}%</p></div>
      </div>
      <p class="subtext" style="margin-top:8px;">전체 평균: <strong>${Math.round(stat.avgTotal / 5 * 100)}%</strong></p>
      ${chartHtml}
      <h4 style="margin-top:16px;margin-bottom:8px;">문항별 통계</h4>
      <div class="chart-block">
        ${stat.questionStats.map((q, qi) => {
          const pct = Math.round(q.avg / 5 * 100);
          const barClass = q.categoryId === "ai" ? "chart-bar" : "chart-bar bar-alt";
          return `<div class="chart-row">
            <p class="chart-label q-btn" style="min-width:40px;cursor:pointer;color:#2563eb;text-decoration:underline;" data-role="${roleId}" data-qi="${qi}">${q.num}번</p>
            <div class="chart-track"><div class="${barClass}" style="width:${pct}%"></div></div>
            <p class="chart-value">${pct}%</p>
          </div>`;
        }).join("")}
      </div>
    `;
    statsContent.appendChild(card);
  });

  const maxCount = Math.max(1, ...roleStats.map((item) => item.stat.count));
  const volumeCard = document.createElement("div");
  volumeCard.className = "stats-card";
  volumeCard.innerHTML = `
    <h3 class="stats-title">대상별 응답 건수 그래프</h3>
    ${roleStats
      .map(
        (item) => `
      <div class="chart-row">
        <p class="chart-label">${item.role.name}</p>
        <div class="chart-track"><div class="chart-bar bar-count" style="width:${(item.stat.count / maxCount) * 100}%"></div></div>
        <p class="chart-value">${item.stat.count}건</p>
      </div>
    `
      )
      .join("")}
  `;
  statsContent.appendChild(volumeCard);

  statsContent.querySelectorAll(".q-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      showQuestionPopup(btn.dataset.role, Number(btn.dataset.qi));
    });
  });
}

async function renderStats() {
  statsContent.innerHTML = `<p class="subtext">통계를 불러오는 중…</p>`;
  let allResults;
  try {
    allResults = await fetchResults();
  } catch {
    statsContent.innerHTML = `<p class="subtext">불러오기에 실패했습니다. 네트워크와 API 주소를 확인한 뒤 새로고침 해 주세요.</p>`;
    return;
  }
  if (!Array.isArray(allResults)) allResults = [];
  paintStats(allResults);
}

function renderBarChart(stat) {
  return `
    <div class="chart-block">
      <div class="chart-row">
        <p class="chart-label">${stat.labelA}</p>
        <div class="chart-track"><div class="chart-bar" style="width:${(stat.avgA / 5) * 100}%"></div></div>
        <p class="chart-value">${Math.round(stat.avgA / 5 * 100)}%</p>
      </div>
      <div class="chart-row">
        <p class="chart-label">${stat.labelB}</p>
        <div class="chart-track"><div class="chart-bar bar-alt" style="width:${(stat.avgB / 5) * 100}%"></div></div>
        <p class="chart-value">${Math.round(stat.avgB / 5 * 100)}%</p>
      </div>
      <div class="chart-row">
        <p class="chart-label">전체 평균</p>
        <div class="chart-track"><div class="chart-bar bar-total" style="width:${(stat.avgTotal / 5) * 100}%"></div></div>
        <p class="chart-value">${Math.round(stat.avgTotal / 5 * 100)}%</p>
      </div>
    </div>
  `;
}

function renderPieChart(stat) {
  const total = stat.avgA + stat.avgB || 1;
  const aPercent = (stat.avgA / total) * 100;
  return `
    <div class="pie-wrap">
      <div class="pie-chart" style="background: conic-gradient(#2563eb 0% ${aPercent}%, #16a34a ${aPercent}% 100%);"></div>
      <div class="pie-legend">
        <p><span class="dot dot-a"></span>${stat.labelA}: ${Math.round(stat.avgA / 5 * 100)}%</p>
        <p><span class="dot dot-b"></span>${stat.labelB}: ${Math.round(stat.avgB / 5 * 100)}%</p>
        <p><span class="dot dot-c"></span>전체 평균: ${Math.round(stat.avgTotal / 5 * 100)}%</p>
      </div>
    </div>
  `;
}

async function clearAllStats() {
  if (!confirm("저장된 설문 결과를 모두 삭제할까요?")) return;
  try {
    await clearResults();
  } catch {
    alert("삭제 요청에 실패했습니다.");
    return;
  }
  await renderStats();
}

async function downloadCsv() {
  let rows;
  try {
    rows = await fetchResults();
  } catch {
    alert("데이터를 불러오지 못했습니다.");
    return;
  }
  if (!rows.length) {
    alert("저장된 응답이 없습니다.");
    return;
  }
  const csv = exportResultsToCsv(rows);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `survey-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

loginButton.addEventListener("click", () => {
  tryLogin();
});
passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") tryLogin();
});
clearAllButton.addEventListener("click", () => {
  clearAllStats();
});
chartTypeSelect.addEventListener("change", () => {
  chartType = chartTypeSelect.value;
  if (!dashboardSection.classList.contains("hidden")) {
    renderStats();
  }
});
if (refreshStatsButton) {
  refreshStatsButton.addEventListener("click", () => {
    if (!dashboardSection.classList.contains("hidden")) {
      renderStats();
    }
  });
}
if (downloadCsvButton) {
  downloadCsvButton.addEventListener("click", () => {
    downloadCsv();
  });
}
