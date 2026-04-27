const ROLES = [
  { id: "student", name: "학생용" },
  { id: "teacher", name: "교사용" },
  { id: "parent", name: "학부모용" },
];

const CHOICES = [
  { value: 1, label: "1점" },
  { value: 2, label: "2점" },
  { value: 3, label: "3점" },
  { value: 4, label: "4점" },
  { value: 5, label: "5점" },
];

const STORAGE_KEY = "school-survey-results-v1";

const roleLabels = {
  student: "학생",
  teacher: "교사",
  parent: "학부모",
};

const socialEmotionalTemplates = [
  "{target}는 학교 생활에서 자신의 감정을 적절히 표현한다.",
  "{target}는 갈등 상황에서 대화를 통해 문제를 해결하려고 노력한다.",
  "{target}는 친구/동료를 배려하고 존중하는 태도를 보인다.",
  "{target}는 어려운 상황에서도 스스로 마음을 조절하려고 한다.",
  "{target}는 공동체 규칙을 이해하고 지키려는 편이다.",
  "{target}는 도움을 요청하거나 도움을 주는 데에 적극적이다.",
  "{target}는 학급(학교) 활동에 책임감을 가지고 참여한다.",
  "{target}는 타인의 의견을 경청하고 수용하려고 한다.",
  "{target}는 실패나 실수 후 다시 시도하려는 회복탄력성을 보인다.",
  "{target}는 스스로의 강점과 약점을 이해하고 있다.",
  "{target}는 다양한 사람과 협력하는 데에 어려움이 적다.",
  "{target}는 일상에서 긍정적인 관계를 유지하려고 노력한다.",
];

const digitalLiteracyTemplates = [
  "{target}는 AI 도구의 장점과 한계를 알고 활용한다.",
  "{target}는 온라인 정보의 출처와 신뢰성을 확인한다.",
  "{target}는 디지털 기기를 학습/업무 목적에 맞게 활용한다.",
  "{target}는 생성형 AI 결과를 그대로 믿지 않고 검토한다.",
  "{target}는 개인정보와 보안의 중요성을 인식하고 실천한다.",
  "{target}는 디지털 윤리(저작권, 인용, 책임 있는 사용)를 이해한다.",
  "{target}는 문제 해결을 위해 적절한 디지털 도구를 선택한다.",
  "{target}는 온라인 협업 도구를 효과적으로 활용한다.",
  "{target}는 AI 또는 디지털 기술로 학습/업무 효율을 높인다.",
  "{target}는 디지털 환경에서 발생하는 위험(가짜정보 등)을 구별한다.",
  "{target}는 디지털 콘텐츠를 비판적으로 읽고 해석한다.",
  "{target}는 새로운 디지털 기술을 배우려는 태도가 있다.",
];

let selectedRole = null;
let activeResponses = {};
let surveyQuestions = [];
let savedResults = loadResults();

const roleButtons = document.getElementById("roleButtons");
const surveySection = document.getElementById("surveySection");
const surveyTitle = document.getElementById("surveyTitle");
const surveyDescription = document.getElementById("surveyDescription");
const surveyForm = document.getElementById("surveyForm");
const questionTemplate = document.getElementById("questionTemplate");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const progressBar = document.getElementById("progressBar");
const submitButton = document.getElementById("submitButton");
const resetCurrentButton = document.getElementById("resetCurrentButton");
const clearAllButton = document.getElementById("clearAllButton");
const statsContent = document.getElementById("statsContent");

function makeQuestions(roleId) {
  const target = roleLabels[roleId];
  const q1 = socialEmotionalTemplates.map((text, index) => ({
    id: `se-${index + 1}`,
    category: "사회정서 실태조사",
    text: text.replace("{target}", target),
  }));
  const q2 = digitalLiteracyTemplates.map((text, index) => ({
    id: `ai-${index + 1}`,
    category: "AI 디지털 리터러시 역량",
    text: text.replace("{target}", target),
  }));
  return [...q1, ...q2];
}

function renderRoleButtons() {
  roleButtons.innerHTML = "";
  ROLES.forEach((role) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "role-btn";
    button.textContent = role.name;
    button.addEventListener("click", () => selectRole(role.id));
    roleButtons.appendChild(button);
  });
}

function selectRole(roleId) {
  selectedRole = roleId;
  activeResponses = {};
  surveyQuestions = makeQuestions(roleId);

  document.querySelectorAll(".role-btn").forEach((btn, idx) => {
    const role = ROLES[idx];
    btn.classList.toggle("active", role.id === roleId);
  });

  surveyTitle.textContent = `${ROLES.find((r) => r.id === roleId).name} 설문 (총 24문항)`;
  surveyDescription.textContent = "모든 문항을 1점(매우 아니다) ~ 5점(매우 그렇다)으로 응답해 주세요.";

  renderSurvey();
  surveySection.classList.remove("hidden");
  surveySection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderSurvey() {
  surveyForm.innerHTML = "";

  surveyQuestions.forEach((question, index) => {
    const node = questionTemplate.content.cloneNode(true);
    const card = node.querySelector(".question-card");
    const category = node.querySelector(".category");
    const number = node.querySelector(".number");
    const text = node.querySelector(".question-text");
    const choiceGrid = node.querySelector(".choice-grid");

    category.textContent = question.category;
    number.textContent = `${index + 1}번`;
    text.textContent = question.text;

    CHOICES.forEach((choice) => {
      const id = `${question.id}-${choice.value}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.textContent = choice.label;

      const input = document.createElement("input");
      input.type = "radio";
      input.name = question.id;
      input.id = id;
      input.value = String(choice.value);
      input.addEventListener("change", () => {
        activeResponses[question.id] = choice.value;
        updateQuestionSelectionUI(card, question.id);
        updateProgress();
      });

      label.appendChild(input);
      choiceGrid.appendChild(label);
    });

    surveyForm.appendChild(node);
  });

  updateProgress();
}

function updateQuestionSelectionUI(card, questionId) {
  card.querySelectorAll("label").forEach((label) => {
    const input = label.querySelector("input");
    const selected = Number(input.value) === activeResponses[questionId];
    label.classList.toggle("selected", selected);
  });
}

function updateProgress() {
  const answered = Object.keys(activeResponses).length;
  const total = surveyQuestions.length || 24;
  const percent = Math.round((answered / total) * 100);
  progressText.textContent = `${answered} / ${total}`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
}

function submitSurvey() {
  if (!selectedRole) {
    alert("먼저 참여 대상을 선택해 주세요.");
    return;
  }

  const unanswered = surveyQuestions.filter((q) => !activeResponses[q.id]);
  if (unanswered.length) {
    alert(`미응답 문항이 ${unanswered.length}개 있습니다. 모든 문항에 응답해 주세요.`);
    return;
  }

  savedResults.push({
    role: selectedRole,
    submittedAt: new Date().toISOString(),
    responses: { ...activeResponses },
  });
  saveResults(savedResults);

  alert("설문이 제출되었습니다. 통계가 업데이트되었습니다.");
  activeResponses = {};
  renderSurvey();
  renderStats();
}

function getRoleData(roleId) {
  return savedResults.filter((entry) => entry.role === roleId);
}

function calcAverage(roleData, ids) {
  if (!roleData.length) return 0;
  let sum = 0;
  let count = 0;
  roleData.forEach((entry) => {
    ids.forEach((id) => {
      sum += Number(entry.responses[id] || 0);
      count += 1;
    });
  });
  return count ? sum / count : 0;
}

function renderStats() {
  statsContent.innerHTML = "";

  const allCount = savedResults.length;
  const top = document.createElement("p");
  top.className = "subtext";
  top.textContent = `전체 제출 건수: ${allCount}건`;
  statsContent.appendChild(top);

  ROLES.forEach((role) => {
    const roleData = getRoleData(role.id);
    const socialIds = Array.from({ length: 12 }, (_, i) => `se-${i + 1}`);
    const aiIds = Array.from({ length: 12 }, (_, i) => `ai-${i + 1}`);

    const socialAvg = calcAverage(roleData, socialIds);
    const aiAvg = calcAverage(roleData, aiIds);
    const totalAvg = calcAverage(roleData, [...socialIds, ...aiIds]);

    const card = document.createElement("div");
    card.className = "stats-card";
    card.innerHTML = `
      <h3 class="stats-title">${role.name}</h3>
      <div class="stats-grid">
        <div class="kpi">
          <p class="kpi-label">응답 건수</p>
          <p class="kpi-value">${roleData.length}건</p>
        </div>
        <div class="kpi">
          <p class="kpi-label">사회정서 평균 (12문항)</p>
          <p class="kpi-value">${socialAvg.toFixed(2)} / 5</p>
        </div>
        <div class="kpi">
          <p class="kpi-label">AI 리터러시 평균 (12문항)</p>
          <p class="kpi-value">${aiAvg.toFixed(2)} / 5</p>
        </div>
      </div>
      <p class="subtext" style="margin-top:8px;">전체 평균: <strong>${totalAvg.toFixed(2)} / 5</strong></p>
    `;
    statsContent.appendChild(card);
  });
}

function saveResults(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadResults() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function clearAllStats() {
  if (!confirm("저장된 모든 설문 통계를 삭제할까요?")) return;
  savedResults = [];
  saveResults(savedResults);
  renderStats();
}

function resetCurrentResponses() {
  activeResponses = {};
  renderSurvey();
}

submitButton.addEventListener("click", submitSurvey);
resetCurrentButton.addEventListener("click", resetCurrentResponses);
clearAllButton.addEventListener("click", clearAllStats);

renderRoleButtons();
renderStats();
