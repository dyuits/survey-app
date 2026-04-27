const CHOICES = [
  { value: 1, label: "매우 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
];

const roleId = document.body.dataset.role;
const roleConfig = ROLE_CONFIG[roleId];
const questions = getAllQuestions(roleId);
const questionMap = new Map(questions.map((question) => [question.id, question]));
const responses = {};

const pageTitle = document.getElementById("pageTitle");
const pageIntro = document.getElementById("pageIntro");
const scaleLabel = document.getElementById("scaleLabel");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const progressBar = document.getElementById("progressBar");
const surveyForm = document.getElementById("surveyForm");
const questionTemplate = document.getElementById("questionTemplate");
const submitButton = document.getElementById("submitButton");
const resetButton = document.getElementById("resetButton");

function initPage() {
  if (!roleConfig) {
    document.body.innerHTML = "<main class='container'><p>잘못된 설문 경로입니다.</p></main>";
    return;
  }
  pageTitle.textContent = `${roleConfig.name} 설문 (총 ${questions.length}문항)`;
  pageIntro.textContent = roleConfig.intro;
  scaleLabel.textContent = SCALE_LABEL;
  renderQuestions();
  updateProgress();
}

function renderQuestions() {
  surveyForm.innerHTML = "";
  let questionNumber = 1;
  roleConfig.categories.forEach((section, sectionIndex) => {
    const sectionTitle = document.createElement("h3");
    sectionTitle.className = "section-title";
    const sectionLabel =
      section.id === "ai"
        ? "AI 디지털 리터러시 역량"
        : section.id === "se"
          ? "사회정서 설문문항"
          : section.name;
    sectionTitle.textContent = `${sectionIndex + 1}. ${sectionLabel}`;
    surveyForm.appendChild(sectionTitle);

    section.questions.forEach((_, indexInSection) => {
      const question = questionMap.get(`${section.id}-${indexInSection + 1}`);
      if (!question) return;

      const node = questionTemplate.content.cloneNode(true);
      const card = node.querySelector(".question-card");
      const category = node.querySelector(".category");
      const number = node.querySelector(".number");
      const text = node.querySelector(".question-text");
      const choiceGrid = node.querySelector(".choice-grid");

      category.textContent = section.name;
      number.textContent = `${questionNumber}번`;
      text.textContent = question.text;

      CHOICES.forEach((choice) => {
        const id = `${question.id}-${choice.value}`;
        const label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = `${choice.value}. ${choice.label}`;

        const input = document.createElement("input");
        input.type = "radio";
        input.name = question.id;
        input.id = id;
        input.value = String(choice.value);
        input.addEventListener("change", () => {
          responses[question.id] = choice.value;
          updateSelection(card, question.id);
          updateProgress();
        });

        label.appendChild(input);
        choiceGrid.appendChild(label);
      });

      surveyForm.appendChild(node);
      questionNumber += 1;
    });
  });
}

function updateSelection(card, questionId) {
  card.querySelectorAll("label").forEach((label) => {
    const input = label.querySelector("input");
    label.classList.toggle("selected", Number(input.value) === responses[questionId]);
  });
}

function updateProgress() {
  const answered = Object.keys(responses).length;
  const total = questions.length;
  const percent = Math.round((answered / total) * 100);
  progressText.textContent = `${answered} / ${total}`;
  progressPercent.textContent = `${percent}%`;
  progressBar.style.width = `${percent}%`;
}

function submitSurvey() {
  const missed = questions.filter((q) => !responses[q.id]);
  if (missed.length > 0) {
    alert(`미응답 문항 ${missed.length}개가 있습니다. 모든 문항에 응답해 주세요.`);
    return;
  }

  const results = loadResults();
  results.push({
    role: roleId,
    submittedAt: new Date().toISOString(),
    responses: { ...responses },
  });
  saveResults(results);

  alert("설문이 제출되었습니다. 감사합니다.");
  window.location.reload();
}

function resetForm() {
  Object.keys(responses).forEach((key) => delete responses[key]);
  renderQuestions();
  updateProgress();
}

submitButton.addEventListener("click", submitSurvey);
resetButton.addEventListener("click", resetForm);
initPage();
