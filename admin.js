const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const passwordInput = document.getElementById("passwordInput");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");
const statsContent = document.getElementById("statsContent");
const clearAllButton = document.getElementById("clearAllButton");

function tryLogin() {
  const value = passwordInput.value.trim();
  if (value !== ADMIN_PASSWORD) {
    loginMessage.textContent = "비밀번호가 올바르지 않습니다.";
    return;
  }
  loginMessage.textContent = "";
  loginSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  renderStats();
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

function makeRoleStats(roleId, allResults) {
  const config = ROLE_CONFIG[roleId];
  const items = allResults.filter((row) => row.role === roleId);
  const categoryA = config.categories[0];
  const categoryB = config.categories[1];
  const idsA = categoryA.questions.map((_, i) => `${categoryA.id}-${i + 1}`);
  const idsB = categoryB.questions.map((_, i) => `${categoryB.id}-${i + 1}`);
  const totalIds = [...idsA, ...idsB];
  return {
    count: items.length,
    avgA: calcAverage(items, idsA),
    avgB: calcAverage(items, idsB),
    avgTotal: calcAverage(items, totalIds),
    labelA: categoryA.name,
    labelB: categoryB.name,
  };
}

function renderStats() {
  const allResults = loadResults();
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
    card.innerHTML = `
      <h3 class="stats-title">${role.name}</h3>
      <div class="stats-grid">
        <div class="kpi"><p class="kpi-label">응답 건수</p><p class="kpi-value">${stat.count}건</p></div>
        <div class="kpi"><p class="kpi-label">${stat.labelA} 평균</p><p class="kpi-value">${stat.avgA.toFixed(2)} / 5</p></div>
        <div class="kpi"><p class="kpi-label">${stat.labelB} 평균</p><p class="kpi-value">${stat.avgB.toFixed(2)} / 5</p></div>
      </div>
      <p class="subtext" style="margin-top:8px;">전체 평균: <strong>${stat.avgTotal.toFixed(2)} / 5</strong></p>
      <div class="chart-block">
        <div class="chart-row">
          <p class="chart-label">${stat.labelA}</p>
          <div class="chart-track"><div class="chart-bar" style="width:${(stat.avgA / 5) * 100}%"></div></div>
          <p class="chart-value">${stat.avgA.toFixed(2)}</p>
        </div>
        <div class="chart-row">
          <p class="chart-label">${stat.labelB}</p>
          <div class="chart-track"><div class="chart-bar bar-alt" style="width:${(stat.avgB / 5) * 100}%"></div></div>
          <p class="chart-value">${stat.avgB.toFixed(2)}</p>
        </div>
        <div class="chart-row">
          <p class="chart-label">전체 평균</p>
          <div class="chart-track"><div class="chart-bar bar-total" style="width:${(stat.avgTotal / 5) * 100}%"></div></div>
          <p class="chart-value">${stat.avgTotal.toFixed(2)}</p>
        </div>
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
}

function clearAllStats() {
  if (!confirm("저장된 설문 결과를 모두 삭제할까요?")) return;
  saveResults([]);
  renderStats();
}

loginButton.addEventListener("click", tryLogin);
passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") tryLogin();
});
clearAllButton.addEventListener("click", clearAllStats);
