// Risk of Bias 2.0 Assessment System
class RoBAssessment {
  constructor() {
    this.studies = JSON.parse(localStorage.getItem("rob-studies") || "[]");
    this.cleanDemoData(); // Clean any demo data on initialization
    this.currentStudy = null;
    this.effectType = "assignment"; // 'assignment' or 'adhering'
    this.handleStudyControlClick = null; // Initialize event handler property

    // Complete RoB 2.0 domains with all signalling questions
    this.domains = {
      randomization: {
        name: "Domain 1: 隨機化過程產生的偏差風險",
        questions: [
          {
            id: "1.1",
            text: "分配序列是否隨機？",
            textEn: "Was the allocation sequence random?",
            riskIndicators: { low: ["Y", "PY"], high: ["N", "PN"] },
          },
          {
            id: "1.2",
            text: "分配序列是否隱藏到參與者被納入並分配至介入措施？",
            textEn:
              "Was the allocation sequence concealed until participants were enrolled and assigned to interventions?",
            riskIndicators: { low: ["Y", "PY"], high: ["N", "PN"] },
          },
          {
            id: "1.3",
            text: "介入組之間的基線差異是否顯示隨機化過程有問題？",
            textEn:
              "Did baseline differences between intervention groups suggest a problem with the randomization process?",
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
        ],
      },
      deviations_assignment: {
        name: "Domain 2: 偏離預期介入措施的偏差風險 (分配效果)",
        condition: () => this.effectType === "assignment",
        questions: [
          {
            id: "2.1",
            text: "參與者在試驗期間是否知道其分配的介入措施？",
            textEn:
              "Were participants aware of their assigned intervention during the trial?",
            riskIndicators: { neutral: true },
          },
          {
            id: "2.2",
            text: "照護者和提供介入措施的人員在試驗期間是否知道參與者的分配介入？",
            textEn:
              "Were carers and people delivering the interventions aware of participants' assigned intervention during the trial?",
            riskIndicators: { neutral: true },
          },
          {
            id: "2.3",
            text: "如果 2.1 或 2.2 回答 Y/PY/NI：是否存在因試驗情境而產生的預期介入偏離？",
            textEn:
              "If Y/PY/NI to 2.1 or 2.2: Were there deviations from the intended intervention that arose because of the trial context?",
            conditional: true,
            dependsOn: ["2.1", "2.2"],
            showWhen: (answers) =>
              ["Y", "PY", "NI"].includes(answers["2.1"]) ||
              ["Y", "PY", "NI"].includes(answers["2.2"]),
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
          {
            id: "2.4",
            text: "如果 2.3 回答 Y/PY：這些偏離是否可能影響結果？",
            textEn:
              "If Y/PY to 2.3: Were these deviations likely to have affected the outcome?",
            conditional: true,
            dependsOn: ["2.3"],
            showWhen: (answers) => ["Y", "PY"].includes(answers["2.3"]),
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
          {
            id: "2.5",
            text: "如果 2.4 回答 Y/PY/NI：這些預期介入偏離在組間是否平衡？",
            textEn:
              "If Y/PY/NI to 2.4: Were these deviations from intended intervention balanced between groups?",
            conditional: true,
            dependsOn: ["2.4"],
            showWhen: (answers) => ["Y", "PY", "NI"].includes(answers["2.4"]),
            riskIndicators: { low: ["Y", "PY"], high: ["N", "PN"] },
          },
          {
            id: "2.6",
            text: "是否使用適當的分析來估計分配至介入的效果？",
            textEn:
              "Was an appropriate analysis used to estimate the effect of assignment to intervention?",
            riskIndicators: { low: ["Y", "PY"], high: ["N", "PN"] },
          },
          {
            id: "2.7",
            text: "如果 2.6 回答 N/PN/NI：未能按隨機分配組別分析參與者是否可能對結果產生實質影響？",
            textEn:
              "If N/PN/NI to 2.6: Was there potential for a substantial impact (on the result) of the failure to analyse participants in the group to which they were randomized?",
            conditional: true,
            dependsOn: ["2.6"],
            showWhen: (answers) => ["N", "PN", "NI"].includes(answers["2.6"]),
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
        ],
      },
      deviations_adhering: {
        name: "Domain 2: 偏離預期介入措施的偏差風險 (依從效果)",
        condition: () => this.effectType === "adhering",
        questions: [
          {
            id: "2.1",
            text: "參與者在試驗期間是否知道其分配的介入措施？",
            textEn:
              "Were participants aware of their assigned intervention during the trial?",
            riskIndicators: { neutral: true },
          },
          {
            id: "2.2",
            text: "照護者和提供介入措施的人員在試驗期間是否知道參與者的分配介入？",
            textEn:
              "Were carers and people delivering the interventions aware of participants' assigned intervention during the trial?",
            riskIndicators: { neutral: true },
          },
          {
            id: "2.3",
            text: "[如適用] 如果 2.1 或 2.2 回答 Y/PY/NI：重要的非試驗方案介入在介入組間是否平衡？",
            textEn:
              "[If applicable:] If Y/PY/NI to 2.1 or 2.2: Were important non-protocol interventions balanced across intervention groups?",
            conditional: true,
            dependsOn: ["2.1", "2.2"],
            showWhen: (answers) =>
              ["Y", "PY", "NI"].includes(answers["2.1"]) ||
              ["Y", "PY", "NI"].includes(answers["2.2"]),
            riskIndicators: { low: ["Y", "PY", "NA"], high: ["N", "PN"] },
          },
          {
            id: "2.4",
            text: "[如適用] 是否存在可能影響結果的介入實施失敗？",
            textEn:
              "[If applicable:] Were there failures in implementing the intervention that could have affected the outcome?",
            riskIndicators: { low: ["N", "PN", "NA"], high: ["Y", "PY"] },
          },
          {
            id: "2.5",
            text: "[如適用] 是否存在可能影響參與者結果的分配介入依從性不良？",
            textEn:
              "[If applicable:] Was there non-adherence to the assigned intervention regimen that could have affected participants' outcomes?",
            riskIndicators: { low: ["N", "PN", "NA"], high: ["Y", "PY"] },
          },
          {
            id: "2.6",
            text: "如果 2.3 回答 N/PN/NI，或 2.4 或 2.5 回答 Y/PY/NI：是否使用適當的分析來估計依從介入的效果？",
            textEn:
              "If N/PN/NI to 2.3, or Y/PY/NI to 2.4 or 2.5: Was an appropriate analysis used to estimate the effect of adhering to the intervention?",
            conditional: true,
            dependsOn: ["2.3", "2.4", "2.5"],
            showWhen: (answers) =>
              ["N", "PN", "NI"].includes(answers["2.3"]) ||
              ["Y", "PY", "NI"].includes(answers["2.4"]) ||
              ["Y", "PY", "NI"].includes(answers["2.5"]),
            riskIndicators: { low: ["Y", "PY", "NA"], high: ["N", "PN"] },
          },
        ],
      },
      missing: {
        name: "Domain 3: 缺失結果數據的偏差風險",
        questions: [
          {
            id: "3.1",
            text: "此結果的數據是否對所有或幾乎所有隨機分配的參與者都可獲得？",
            textEn:
              "Were data for this outcome available for all, or nearly all, participants randomized?",
            riskIndicators: { low: ["Y", "PY"], high: ["N", "PN"] },
          },
          {
            id: "3.2",
            text: "如果 3.1 回答 N/PN/NI：是否有證據顯示結果不受缺失結果數據的偏差影響？",
            textEn:
              "If N/PN/NI to 3.1: Is there evidence that the result was not biased by missing outcome data?",
            conditional: true,
            dependsOn: ["3.1"],
            showWhen: (answers) => ["N", "PN", "NI"].includes(answers["3.1"]),
            riskIndicators: { low: ["Y", "PY"], high: ["N", "PN"] },
          },
          {
            id: "3.3",
            text: "如果 3.2 回答 N/PN：結果的缺失是否可能取決於其真實值？",
            textEn:
              "If N/PN to 3.2: Could missingness in the outcome depend on its true value?",
            conditional: true,
            dependsOn: ["3.2"],
            showWhen: (answers) => ["N", "PN"].includes(answers["3.2"]),
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
          {
            id: "3.4",
            text: "如果 3.3 回答 Y/PY/NI：結果的缺失是否可能取決於其真實值？",
            textEn:
              "If Y/PY/NI to 3.3: Is it likely that missingness in the outcome depended on its true value?",
            conditional: true,
            dependsOn: ["3.3"],
            showWhen: (answers) => ["Y", "PY", "NI"].includes(answers["3.3"]),
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
        ],
      },
      measurement: {
        name: "Domain 4: 結果測量的偏差風險",
        questions: [
          {
            id: "4.1",
            text: "測量結果的方法是否不適當？",
            textEn: "Was the method of measuring the outcome inappropriate?",
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
          {
            id: "4.2",
            text: "結果的測量或確認在介入組間是否可能有差異？",
            textEn:
              "Could measurement or ascertainment of the outcome have differed between intervention groups?",
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
          {
            id: "4.3",
            text: "如果 4.1 和 4.2 都回答 N/PN/NI：結果評估者是否知道研究參與者所接受的介入？",
            textEn:
              "If N/PN/NI to 4.1 and 4.2: Were outcome assessors aware of the intervention received by study participants?",
            conditional: true,
            dependsOn: ["4.1", "4.2"],
            showWhen: (answers) =>
              ["N", "PN", "NI"].includes(answers["4.1"]) &&
              ["N", "PN", "NI"].includes(answers["4.2"]),
            riskIndicators: { neutral: true },
          },
          {
            id: "4.4",
            text: "如果 4.3 回答 Y/PY/NI：結果評估是否可能受到介入知識的影響？",
            textEn:
              "If Y/PY/NI to 4.3: Could assessment of the outcome have been influenced by knowledge of intervention received?",
            conditional: true,
            dependsOn: ["4.3"],
            showWhen: (answers) => ["Y", "PY", "NI"].includes(answers["4.3"]),
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
          {
            id: "4.5",
            text: "如果 4.4 回答 Y/PY/NI：結果評估可能受到介入知識的影響？",
            textEn:
              "If Y/PY/NI to 4.4: Is it likely that assessment of the outcome was influenced by knowledge of intervention received?",
            conditional: true,
            dependsOn: ["4.4"],
            showWhen: (answers) => ["Y", "PY", "NI"].includes(answers["4.4"]),
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
        ],
      },
      selection: {
        name: "Domain 5: 報告結果選擇的偏差風險",
        questions: [
          {
            id: "5.1",
            text: "產生此結果的數據是否按照在非盲法結果數據可獲得分析之前最終確定的預先指定分析計劃進行分析？",
            textEn:
              "Were the data that produced this result analysed in accordance with a pre-specified analysis plan that was finalized before unblinded outcome data were available for analysis?",
            riskIndicators: { low: ["Y", "PY"], high: ["N", "PN"] },
          },
          {
            id: "5.2",
            text: "正在評估的數值結果是否可能根據結果從多個合格的結果測量（例如量表、定義、時間點）中選擇？",
            textEn:
              "Is the numerical result being assessed likely to have been selected, on the basis of the results, from... multiple eligible outcome measurements (e.g. scales, definitions, time points) within the outcome domain?",
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
          {
            id: "5.3",
            text: "正在評估的數值結果是否可能根據結果從多個合格的數據分析中選擇？",
            textEn:
              "Is the numerical result being assessed likely to have been selected, on the basis of the results, from... multiple eligible analyses of the data?",
            riskIndicators: { low: ["N", "PN"], high: ["Y", "PY"] },
          },
        ],
      },
    };

    // Answer options for all questions
    this.answerOptions = [
      { value: "Y", label: "是 (Yes)", class: "yes", riskIndicator: "varies" },
      {
        value: "PY",
        label: "可能是 (Probably Yes)",
        class: "probably-yes",
        riskIndicator: "varies",
      },
      {
        value: "PN",
        label: "可能否 (Probably No)",
        class: "probably-no",
        riskIndicator: "varies",
      },
      { value: "N", label: "否 (No)", class: "no", riskIndicator: "varies" },
      {
        value: "NI",
        label: "無資訊 (No Information)",
        class: "no-info",
        riskIndicator: "neutral",
      },
      {
        value: "NA",
        label: "不適用 (Not Applicable)",
        class: "not-applicable",
        riskIndicator: "neutral",
      },
    ];

    // Bias direction options
    this.biasDirectionOptions = [
      { value: "NA", label: "不適用 (NA)" },
      {
        value: "favours_experimental",
        label: "偏向實驗組 (Favours experimental)",
      },
      { value: "favours_comparator", label: "偏向對照組 (Favours comparator)" },
      { value: "towards_null", label: "偏向無效應 (Towards null)" },
      { value: "away_from_null", label: "遠離無效應 (Away from null)" },
      { value: "unpredictable", label: "無法預測 (Unpredictable)" },
    ];
  }

  saveStudies() {
    localStorage.setItem("rob-studies", JSON.stringify(this.studies));
  }

  cleanDemoData() {
    // Remove any demo data that might have been accidentally saved
    const originalLength = this.studies.length;
    this.studies = this.studies.filter((study) => {
      // Remove studies with demo IDs or specific demo study names
      const isDemoById = study.id && study.id.startsWith("demo-");
      const isDemoByAuthor =
        study.authors &&
        (study.authors.includes("Mayser") ||
          study.authors.includes("Soyland") ||
          study.authors.includes("Holm-Bentzen") ||
          study.authors.includes("Kasyan") ||
          study.authors.includes("Mulholland") ||
          study.authors.includes("Test")) &&
        (study.year === "1998" ||
          study.year === "1993" ||
          study.year === "1987" ||
          study.year === "2021" ||
          study.year === "1990" ||
          study.year === "2020");

      return !isDemoById && !isDemoByAuthor;
    });

    // Save cleaned data back to localStorage if anything was removed
    if (this.studies.length !== originalLength) {
      console.log(
        `Cleaned ${originalLength - this.studies.length} demo studies`,
      );
      this.saveStudies();
    }
  }

  renderStudiesList() {
    const container = document.getElementById("studies-container");
    const emptyState = document.getElementById("empty-state");

    // Check if elements exist before accessing their properties
    if (!container) {
      console.error("studies-container element not found");
      return;
    }

    if (this.studies.length === 0) {
      if (emptyState) {
        emptyState.style.display = "block";
      }
      return;
    }

    if (emptyState) {
      emptyState.style.display = "none";
    }

    const studiesHTML = this.studies
      .map((study, index) => {
        const completedDomains = Object.keys(study.assessments || {}).filter(
          (domain) => study.assessments[domain].judgment,
        ).length;
        const totalDomains = Object.keys(this.domains).length;
        const progress = Math.round((completedDomains / totalDomains) * 100);

        const riskColor = this.getOverallRiskColor(study.overallRisk);

        return `
                <div class="study-item" data-index="${index}">
                    <div class="study-header">
                        <div class="study-info">
                            <h4>${escapeHTML(study.title) || "未命名研究"}</h4>
                            <p>${escapeHTML(study.authors)} (${escapeHTML(study.year)})</p>
                        </div>
                        <div class="study-status">
                            <div class="progress-circle" style="--progress: ${progress}">
                                <span>${progress}%</span>
                            </div>
                            ${
                              study.overallRisk
                                ? `
                                <div class="risk-badge ${riskColor}">
                                    ${study.overallRisk}
                                </div>
                            `
                                : ""
                            }
                        </div>
                    </div>
                    <div class="study-controls">
                        <button class="rob-btn info" data-action="edit" data-index="${index}">
                            <i class="fas fa-edit"></i> 評估
                        </button>
                        <button class="rob-btn secondary" data-action="duplicate" data-index="${index}">
                            <i class="fas fa-copy"></i> 複製
                        </button>
                        <button class="rob-btn danger" data-action="delete" data-index="${index}">
                            <i class="fas fa-trash"></i> 刪除
                        </button>
                    </div>
                </div>
            `;
      })
      .join("");

    container.innerHTML = studiesHTML;

    // Event handling is now done globally by handleGlobalClick
    // No need for individual event listeners

    // Setup responsive tables for mobile
    if (typeof setupResponsiveTables === "function") {
      setupResponsiveTables();
    }
  }

  getOverallRiskColor(risk) {
    const colors = {
      低風險: "low-risk",
      部分擔憂: "some-concerns",
      高風險: "high-risk",
    };
    return colors[risk] || "unknown";
  }

  addNewStudy() {
    console.log("RoBAssessment.addNewStudy() called");
    try {
      const study = {
        id: Date.now().toString(),
        title: "",
        authors: "",
        year: "",
        outcome: "",
        assessments: {},
        overallRisk: null,
        notes: "",
      };

      console.log("Creating new study:", study);
      this.studies.push(study);
      console.log("Studies array now has", this.studies.length, "studies");
      this.saveStudies();
      console.log("Studies saved to localStorage");
      this.renderStudiesList();
      console.log("Studies list rendered");
      this.editStudy(this.studies.length - 1);
      console.log("Opened edit interface for new study");
    } catch (error) {
      console.error("Error in addNewStudy():", error);
      throw error;
    }
  }

  editStudy(index) {
    this.currentStudy = this.studies[index];
    this.showAssessmentInterface();
    this.renderAssessmentForm();
  }

  deleteStudy(index) {
    console.log("deleteStudy method called with index:", index);
    if (index < 0 || index >= this.studies.length) {
      console.error("Invalid study index:", index);
      alert("無效的研究索引");
      return;
    }

    const studyTitle = this.studies[index].title || "未命名研究";
    if (confirm(`確定要刪除研究「${studyTitle}」嗎？此操作無法復原。`)) {
      console.log("User confirmed, deleting study:", studyTitle);
      this.studies.splice(index, 1);
      this.saveStudies();
      this.renderStudiesList();
      console.log("Study deleted successfully");
    } else {
      console.log("User cancelled study deletion");
    }
  }

  clearAllStudies() {
    console.log("clearAllStudies method called");
    console.log("User confirmed, clearing all studies");
    this.studies = [];
    this.saveStudies();
    this.renderStudiesList();
    console.log("All studies cleared successfully");
  }

  duplicateStudy(index) {
    const original = this.studies[index];
    const duplicate = {
      ...original,
      id: Date.now().toString(),
      title: original.title + " (複本)",
      assessments: {},
      overallRisk: null,
    };

    this.studies.push(duplicate);
    this.saveStudies();
    this.renderStudiesList();
  }

  showAssessmentInterface() {
    const assessmentSection = document.getElementById("rob-assessment-section");
    if (assessmentSection) {
      assessmentSection.style.display = "block";
      assessmentSection.scrollIntoView({ behavior: "smooth" });
    } else {
      console.error("rob-assessment-section element not found");
    }
  }

  renderAssessmentForm() {
    const studyInfo = document.getElementById("current-study-info");
    const domainsContainer = document.getElementById("domains-assessment");

    // 顯示研究資訊
    studyInfo.innerHTML = `
            <div class="study-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>研究標題：</label>
                        <input type="text" value="${escapeHTML(this.currentStudy.title)}"
                               onchange="robSystem.updateStudyInfo('title', this.value)">
                    </div>
                    <div class="form-group">
                        <label>作者：</label>
                        <input type="text" value="${escapeHTML(this.currentStudy.authors)}"
                               onchange="robSystem.updateStudyInfo('authors', this.value)">
                    </div>
                    <div class="form-group">
                        <label>年份：</label>
                        <input type="number" value="${escapeHTML(this.currentStudy.year)}"
                               onchange="robSystem.updateStudyInfo('year', this.value)">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>評估的結果指標：</label>
                        <input type="text" value="${escapeHTML(this.currentStudy.outcome)}"
                               onchange="robSystem.updateStudyInfo('outcome', this.value)">
                    </div>
                    <div class="form-group">
                        <label>效果類型 (Domain 2)：</label>
                        <select onchange="robSystem.setEffectType(this.value)" class="effect-type-select">
                            <option value="assignment" ${this.effectType === "assignment" ? "selected" : ""}>
                                分配效果 (Effect of assignment to intervention)
                            </option>
                            <option value="adhering" ${this.effectType === "adhering" ? "selected" : ""}>
                                依從效果 (Effect of adhering to intervention)
                            </option>
                        </select>
                    </div>
                </div>
                <div class="effect-type-note">
                    <p><strong>說明：</strong></p>
                    <ul>
                        <li><strong>分配效果：</strong>評估「分配到該介入措施」的效果（intention-to-treat 分析）</li>
                        <li><strong>依從效果：</strong>評估「實際依從該介入措施」的效果（per-protocol 分析）</li>
                    </ul>
                </div>
            </div>
        `;

    // 生成領域評估表單
    const domainsHTML = Object.entries(this.domains)
      .map(([domainKey, domain]) => {
        const assessment = this.currentStudy.assessments[domainKey] || {};
        return this.renderDomainAssessment(domainKey, domain, assessment);
      })
      .join("");

    domainsContainer.innerHTML = domainsHTML;

    this.updateProgress();
    this.updateOverallRisk();
  }

  renderDomainAssessment(domainKey, domain, assessment) {
    // Skip domains that don't meet their condition
    if (domain.condition && !domain.condition()) {
      return "";
    }

    const answers = assessment.answers || {};

    const questions = domain.questions
      .map((question, index) => {
        // Handle conditional questions
        if (question.conditional && question.showWhen) {
          const shouldShow = question.showWhen(answers);
          if (!shouldShow) {
            return "";
          }
        }

        // Build answer options for this specific question
        const answerOptionsHTML = this.answerOptions
          .map((option) => {
            const isChecked = answers[question.id] === option.value;

            // Determine risk indicator class
            let riskClass = "";
            if (question.riskIndicators) {
              if (
                question.riskIndicators.low &&
                question.riskIndicators.low.includes(option.value)
              ) {
                riskClass = "risk-indicator-low";
              } else if (
                question.riskIndicators.high &&
                question.riskIndicators.high.includes(option.value)
              ) {
                riskClass = "risk-indicator-high";
              }
            }

            return `
                    <label class="radio-option ${riskClass}">
                        <input type="radio" name="${domainKey}_${question.id}" value="${option.value}" 
                               ${isChecked ? "checked" : ""}
                               onchange="robSystem.updateAnswer('${domainKey}', '${question.id}', '${option.value}')">
                        <span class="radio-custom ${option.class}"></span>
                        ${option.label}
                    </label>
                `;
          })
          .join("");

        return `
                <div class="question-item" data-question="${question.id}">
                    <div class="question-header">
                        <span class="question-id">${question.id}</span>
                        <div class="question-text">
                            ${question.text}
                            ${question.textEn ? `<div class="question-text-en">${question.textEn}</div>` : ""}
                        </div>
                    </div>
                    <div class="answer-options">
                        ${answerOptionsHTML}
                    </div>
                    ${question.conditional ? '<div class="conditional-note">條件性問題</div>' : ""}
                </div>
            `;
      })
      .filter((q) => q !== "")
      .join("");

    // Bias direction selection
    const biasDirectionHTML = `
            <div class="bias-direction">
                <label>偏差方向預測 (Optional):</label>
                <select onchange="robSystem.updateBiasDirection('${domainKey}', this.value)" class="bias-direction-select">
                    ${this.biasDirectionOptions
                      .map(
                        (option) => `
                        <option value="${option.value}" ${assessment.biasDirection === option.value ? "selected" : ""}>
                            ${option.label}
                        </option>
                    `,
                      )
                      .join("")}
                </select>
            </div>
        `;

    return `
            <div class="domain-assessment" data-domain="${domainKey}">
                <div class="domain-header">
                    <h3>${domain.name}</h3>
                    <div class="domain-controls">
                        <div class="domain-judgment">
                            <label>風險判斷:</label>
                            <select onchange="robSystem.updateDomainJudgment('${domainKey}', this.value)" class="judgment-select">
                                <option value="">選擇判斷</option>
                                <option value="Low" ${assessment.judgment === "Low" ? "selected" : ""}>Low / 低風險</option>
                                <option value="Some concerns" ${assessment.judgment === "Some concerns" ? "selected" : ""}>Some concerns / 部分擔憂</option>
                                <option value="High" ${assessment.judgment === "High" ? "selected" : ""}>High / 高風險</option>
                            </select>
                        </div>
                        ${biasDirectionHTML}
                    </div>
                </div>
                <div class="domain-questions">
                    ${questions}
                </div>
                <div class="domain-rationale">
                    <label>判斷理由和評論 (Comments):</label>
                    <textarea placeholder="請詳細說明判斷的理由和依據..." 
                             onchange="robSystem.updateRationale('${domainKey}', this.value)">${assessment.rationale || ""}</textarea>
                </div>
            </div>
        `;
  }

  updateStudyInfo(field, value) {
    this.currentStudy[field] = value;
    this.saveStudies();
    this.renderStudiesList();
  }

  updateAnswer(domainKey, questionId, answer) {
    if (!this.currentStudy.assessments[domainKey]) {
      this.currentStudy.assessments[domainKey] = { answers: {} };
    }
    if (!this.currentStudy.assessments[domainKey].answers) {
      this.currentStudy.assessments[domainKey].answers = {};
    }

    this.currentStudy.assessments[domainKey].answers[questionId] = answer;
    this.saveStudies();
    this.updateProgress();

    // Re-render the domain to handle conditional questions
    this.renderAssessmentForm();
  }

  updateDomainJudgment(domainKey, judgment) {
    if (!this.currentStudy.assessments[domainKey]) {
      this.currentStudy.assessments[domainKey] = {};
    }

    this.currentStudy.assessments[domainKey].judgment = judgment;
    this.saveStudies();
    this.updateProgress();
    this.updateOverallRisk();
    this.renderStudiesList();
  }

  updateRationale(domainKey, rationale) {
    if (!this.currentStudy.assessments[domainKey]) {
      this.currentStudy.assessments[domainKey] = {};
    }

    this.currentStudy.assessments[domainKey].rationale = rationale;
    this.saveStudies();
  }

  updateBiasDirection(domainKey, direction) {
    if (!this.currentStudy.assessments[domainKey]) {
      this.currentStudy.assessments[domainKey] = {};
    }

    this.currentStudy.assessments[domainKey].biasDirection = direction;
    this.saveStudies();
  }

  setEffectType(effectType) {
    this.effectType = effectType;
    if (this.currentStudy) {
      this.renderAssessmentForm();
    }
  }

  updateProgress() {
    const completedDomains = Object.keys(this.currentStudy.assessments).filter(
      (domain) => this.currentStudy.assessments[domain].judgment,
    ).length;
    const totalDomains = Object.keys(this.domains).length;
    const progress = Math.round((completedDomains / totalDomains) * 100);

    const progressBar = document.getElementById("assessment-progress");
    if (progressBar) {
      progressBar.style.width = progress + "%";
    } else {
      console.warn("assessment-progress element not found");
    }
  }

  updateOverallRisk() {
    // Get active domains based on effect type
    const activeDomains = Object.entries(this.domains).filter(
      ([key, domain]) => {
        return !domain.condition || domain.condition();
      },
    );

    const judgments = activeDomains
      .map(([key]) => this.currentStudy.assessments[key]?.judgment)
      .filter((judgment) => judgment);

    if (judgments.length !== activeDomains.length) {
      this.currentStudy.overallRisk = null;
      this.renderOverallRisk();
      return; // 尚未完成所有評估
    }

    // RoB 2.0 整體風險判斷規則
    if (judgments.some((j) => j === "High")) {
      this.currentStudy.overallRisk = "High";
    } else if (judgments.some((j) => j === "Some concerns")) {
      this.currentStudy.overallRisk = "Some concerns";
    } else if (judgments.every((j) => j === "Low")) {
      this.currentStudy.overallRisk = "Low";
    } else {
      this.currentStudy.overallRisk = "Some concerns"; // Default to some concerns if mixed
    }

    this.saveStudies();
    this.renderOverallRisk();
  }

  renderOverallRisk() {
    const riskSummary = document.getElementById("risk-summary");
    if (!this.currentStudy.overallRisk) {
      riskSummary.innerHTML =
        '<p class="text-muted">請完成所有領域評估以查看整體風險判斷</p>';
      return;
    }

    const colorClass = this.getOverallRiskColor(this.currentStudy.overallRisk);
    riskSummary.innerHTML = `
            <div class="risk-result ${colorClass}">
                <div class="risk-icon">
                    <i class="fas fa-shield${this.currentStudy.overallRisk === "低風險" ? "-check" : this.currentStudy.overallRisk === "高風險" ? "-times" : ""}"></i>
                </div>
                <div class="risk-text">
                    <h5>整體偏差風險：${this.currentStudy.overallRisk}</h5>
                    <p>${this.getRiskDescription(this.currentStudy.overallRisk)}</p>
                </div>
            </div>
        `;
  }

  getRiskDescription(risk) {
    const descriptions = {
      低風險: "這項研究在所有重要領域都具有低偏差風險",
      部分擔憂: "這項研究在一個或多個領域引起部分擔憂，但沒有高風險領域",
      高風險: "這項研究在一個或多個領域具有高偏差風險",
    };
    return descriptions[risk] || "";
  }
}

// Global RoB system instance
const robSystem = new RoBAssessment();

// RoB 2.0 Global Functions
function addNewStudy() {
  console.log("addNewStudy() called");
  try {
    robSystem.addNewStudy();
    console.log("Successfully added new study");
  } catch (error) {
    console.error("Error adding new study:", error);
    alert("添加研究時出現錯誤: " + error.message);
  }
}

function editStudy(index) {
  console.log("editStudy() called with index:", index);
  try {
    robSystem.editStudy(index);
    console.log("Successfully opened edit interface");
  } catch (error) {
    console.error("Error editing study:", error);
    alert("編輯研究時出現錯誤: " + error.message);
  }
}

function deleteStudy(index) {
  console.log("deleteStudy() global function called with index:", index);
  try {
    if (!robSystem) {
      console.error("robSystem is not initialized");
      alert("系統未初始化，請重新載入頁面");
      return;
    }
    if (typeof index !== "number" || isNaN(index)) {
      console.error("Invalid index provided:", index);
      alert("無效的研究索引");
      return;
    }
    robSystem.deleteStudy(index);
    console.log("Successfully deleted study");
  } catch (error) {
    console.error("Error deleting study:", error);
    alert("刪除研究時出現錯誤: " + error.message);
  }
}

function clearAllStudies() {
  console.log("clearAllStudies() global function called");
  try {
    if (!robSystem) {
      console.error("robSystem is not initialized");
      alert("系統未初始化，請重新載入頁面");
      return;
    }

    // Show confirmation dialog
    if (confirm("確定要清空所有研究評估嗎？此操作無法復原。")) {
      console.log("User confirmed, proceeding with clearAllStudies");
      robSystem.clearAllStudies();
      console.log("Successfully cleared all studies");
    } else {
      console.log("User cancelled clearing all studies");
    }
  } catch (error) {
    console.error("Error clearing all studies:", error);
    alert("清空研究時出現錯誤: " + error.message);
  }
}

function loadDemoData() {
  console.log("loadDemoData() called");
  try {
    if (confirm("這將載入6個示範研究用於測試功能。確定要繼續嗎？")) {
      const demoStudies = createDemoData();
      robSystem.studies = [...robSystem.studies, ...demoStudies];
      robSystem.saveStudies();
      robSystem.renderStudiesList();
      alert("已載入示範資料！");
    }
  } catch (error) {
    console.error("Error loading demo data:", error);
    alert("載入示範資料時出現錯誤: " + error.message);
  }
}

function duplicateStudy(index) {
  console.log("duplicateStudy() called with index:", index);
  try {
    robSystem.duplicateStudy(index);
    console.log("Successfully duplicated study");
  } catch (error) {
    console.error("Error duplicating study:", error);
    alert("複製研究時出現錯誤: " + error.message);
  }
}

function importStudies() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,.csv";
  input.onchange = function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            robSystem.studies = data;
            robSystem.saveStudies();
            robSystem.renderStudiesList();
            alert("成功匯入研究清單！");
          }
        } catch (error) {
          alert("檔案格式錯誤，請確認為有效的 JSON 格式");
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
}

function exportStudies() {
  const data = JSON.stringify(robSystem.studies, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rob-studies-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function saveAssessment() {
  robSystem.saveStudies();
  alert("評估已儲存！");
}

function completeAssessment() {
  if (robSystem.currentStudy.overallRisk) {
    alert("評估已完成！");
    robSystem.renderStudiesList();
  } else {
    alert("請完成所有領域的評估");
  }
}

function previewResults() {
  if (robSystem.studies.length === 0) {
    alert("尚無已完成的研究評估");
    return;
  }

  generateRoBChart();
}
