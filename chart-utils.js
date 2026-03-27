// Chart Utilities for RoB Visualization
function selectChart(chartType) {
  document
    .querySelectorAll(".chart-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-chart="${chartType}"]`).classList.add("active");
  generateRoBChart(chartType);
}

// Chart instance holder
let currentChart = null;
let currentChartType = "traffic-light";

function createDemoData() {
  const demoStudies = [
    {
      id: "demo-1",
      title: "Study 1",
      authors: "Mayser",
      year: "1998",
      assessments: {
        randomization: { judgment: "Some concerns" },
        deviations: { judgment: "Low" },
        missing: { judgment: "Low" },
        measurement: { judgment: "High" },
        selection: { judgment: "High" },
      },
      overallRisk: "High",
    },
    {
      id: "demo-2",
      title: "Study 2",
      authors: "Soyland",
      year: "1993",
      assessments: {
        randomization: { judgment: "Some concerns" },
        deviations: { judgment: "Some concerns" },
        missing: { judgment: "Some concerns" },
        measurement: { judgment: "High" },
        selection: { judgment: "High" },
      },
      overallRisk: "High",
    },
    {
      id: "demo-3",
      title: "Study 3",
      authors: "Holm-Bentzen et al.",
      year: "1987",
      assessments: {
        randomization: { judgment: "Low" },
        deviations: { judgment: "Some concerns" },
        missing: { judgment: "Low" },
        measurement: { judgment: "High" },
        selection: { judgment: "High" },
      },
      overallRisk: "High",
    },
    {
      id: "demo-4",
      title: "Study 4",
      authors: "Kasyan et al.",
      year: "2021",
      assessments: {
        randomization: { judgment: "Low" },
        deviations: { judgment: "Low" },
        missing: { judgment: "Low" },
        measurement: { judgment: "Low" },
        selection: { judgment: "Low" },
      },
      overallRisk: "Low",
    },
    {
      id: "demo-5",
      title: "Study 5",
      authors: "Mulholland et al.",
      year: "1990",
      assessments: {
        randomization: { judgment: "Low" },
        deviations: { judgment: "High" },
        missing: { judgment: "Low" },
        measurement: { judgment: "High" },
        selection: { judgment: "High" },
      },
      overallRisk: "High",
    },
    {
      id: "demo-6",
      title: "Study 6",
      authors: "Test et al.",
      year: "2020",
      assessments: {
        randomization: { judgment: "Low" },
        deviations: { judgment: "Low" },
        missing: { judgment: "Some concerns" },
        measurement: { judgment: "Low" },
        selection: { judgment: "Low" },
      },
      overallRisk: "Some concerns",
    },
  ];

  return demoStudies;
}

async function generateRoBChart(chartType = "traffic-light") {
  currentChartType = chartType; // Track current chart type

  // 動態載入 Chart.js（僅在需要 canvas 圖表時）
  if (
    chartType !== "traffic-light" &&
    typeof Chart === "undefined" &&
    window.loadChartJS
  ) {
    await window.loadChartJS();
  }

  let completedStudies = robSystem.studies.filter((study) => study.overallRisk);

  // If in development mode and no studies exist, create demo data for visualization
  if (DEV_MODE && completedStudies.length === 0) {
    completedStudies = createDemoData();
  }

  const chartPlaceholder = document.getElementById("chart-placeholder");
  const robChart = document.getElementById("rob-chart");
  const robChartTable = document.getElementById("rob-chart-table");

  if (completedStudies.length === 0) {
    if (chartPlaceholder) chartPlaceholder.style.display = "flex";
    if (robChart) robChart.style.display = "none";
    if (robChartTable) robChartTable.style.display = "none";
    return;
  }

  if (chartPlaceholder) chartPlaceholder.style.display = "none";

  // Destroy existing chart if exists
  if (currentChart) {
    currentChart.destroy();
    currentChart = null;
  }

  switch (chartType) {
    case "traffic-light":
      // Show table container, hide canvas
      if (robChart) robChart.style.display = "none";
      if (robChartTable) {
        robChartTable.style.display = "block";
        createTrafficLightPlot(robChartTable, completedStudies);
      }
      break;
    case "weighted-bar":
      // Show canvas, hide table container
      if (robChartTable) robChartTable.style.display = "none";
      if (robChart) {
        robChart.style.display = "block";
        const ctx = robChart.getContext("2d");
        createWeightedBarChart(ctx, completedStudies);
      }
      break;
    default:
      // Show table container, hide canvas
      if (robChart) robChart.style.display = "none";
      if (robChartTable) {
        robChartTable.style.display = "block";
        createTrafficLightPlot(robChartTable, completedStudies);
      }
  }
}

// Helper function to get assessment data based on domain and effect type
function getAssessmentData(study, domain) {
  if (domain === "deviations") {
    // Check which deviations domain has data based on effect type
    const assignmentData = study.assessments?.deviations_assignment?.judgment;
    const adheringData = study.assessments?.deviations_adhering?.judgment;

    // Return whichever has data, prioritizing assignment
    if (assignmentData) return assignmentData;
    if (adheringData) return adheringData;
    return null;
  } else if (domain === "missing") {
    // Handle missing data domain variations
    const missingData = study.assessments?.missing?.judgment;
    const missingDataAlt = study.assessments?.missingData?.judgment;
    return missingData || missingDataAlt || null;
  }

  // For other domains, use standard key
  return study.assessments?.[domain]?.judgment || null;
}

function createTrafficLightPlot(container, studies) {
  const domains = [
    "randomization",
    "deviations",
    "missing",
    "measurement",
    "selection",
  ];
  const domainLabels = {
    randomization: "D1",
    deviations: "D2",
    missing: "D3",
    measurement: "D4",
    selection: "D5",
  };

  const domainFullNames = {
    randomization: "Randomization process",
    deviations: "Deviations from the intended interventions",
    missing: "Missing outcome data",
    measurement: "Measurement of the outcome",
    selection: "Selection of the reported result",
  };

  function getRiskSymbol(risk) {
    switch (risk) {
      case "Low":
        return "+";
      case "Some concerns":
        return "−";
      case "High":
        return "X";
      default:
        return "?";
    }
  }

  function getRiskClass(risk) {
    switch (risk) {
      case "Low":
        return "low-risk";
      case "Some concerns":
        return "some-concerns";
      case "High":
        return "high-risk";
      default:
        return "no-information";
    }
  }

  // Create RoB table HTML matching exact standard format
  let tableHTML = `
        <div class="rob-table-container">
            <div class="rob-title">Risk of bias domains</div>
            <table class="rob-table">
                <thead>
                    <tr>
                        <th class="study-header-cell">Study</th>
                        ${domains.map((domain) => `<th class="domain-header-cell">${domainLabels[domain]}</th>`).join("")}
                        <th class="domain-header-cell overall-header-cell">Overall</th>
                    </tr>
                </thead>
                <tbody>
                    ${studies
                      .map((study, index) => {
                        const studyName = study.authors
                          ? `${escapeHTML(study.authors)} ${escapeHTML(study.year)}`
                          : `Study ${index + 1}`;
                        return `
                            <tr>
                                <td class="study-name-cell">${studyName}</td>
                                ${domains
                                  .map((domain) => {
                                    const risk =
                                      getAssessmentData(study, domain) ||
                                      "Not assessed";
                                    return `<td class="data-cell">
                                        <div class="risk-circle ${getRiskClass(risk)}">${getRiskSymbol(risk)}</div>
                                    </td>`;
                                  })
                                  .join("")}
                                <td class="data-cell overall-data-cell">
                                    <div class="risk-circle ${getRiskClass(study.overallRisk)}">${getRiskSymbol(study.overallRisk)}</div>
                                </td>
                            </tr>
                        `;
                      })
                      .join("")}
                </tbody>
            </table>
            
            <div class="rob-legend">
                <div class="legend-section">
                    <h4>Domains:</h4>
                    ${domains
                      .map(
                        (domain) =>
                          `<p><strong>${domainLabels[domain]}:</strong> ${domainFullNames[domain]}</p>`,
                      )
                      .join("")}
                </div>
                
                <div class="legend-section">
                    <h4>Judgement</h4>
                    <div class="legend-item">
                        <div class="risk-circle high-risk">X</div>
                        <span>High</span>
                    </div>
                    <div class="legend-item">
                        <div class="risk-circle some-concerns">−</div>
                        <span>Some concerns</span>
                    </div>
                    <div class="legend-item">
                        <div class="risk-circle low-risk">+</div>
                        <span>Low</span>
                    </div>
                    <div class="legend-item">
                        <div class="risk-circle no-information">?</div>
                        <span>No information</span>
                    </div>
                </div>
            </div>
        </div>
    `;

  container.innerHTML = tableHTML;
}

function createSummaryPlot(ctx, studies) {
  const domains = [
    "randomization",
    "deviations",
    "missing",
    "measurement",
    "selection",
    "overall",
  ];
  const domainLabels = {
    randomization: "隨機化過程",
    deviations: "偏離預定干預",
    missing: "結果數據缺失",
    measurement: "結果測量",
    selection: "結果選擇報告",
    overall: "整體偏差風險",
  };

  const riskCounts = {};
  domains.forEach((domain) => {
    riskCounts[domain] = {
      Low: 0,
      "Some concerns": 0,
      High: 0,
    };

    studies.forEach((study) => {
      const risk =
        domain === "overall"
          ? study.overallRisk
          : getAssessmentData(study, domain);
      if (risk) {
        riskCounts[domain][risk]++;
      }
    });
  });

  const data = {
    labels: domains.map((d) => domainLabels[d]),
    datasets: [
      {
        label: "低風險",
        data: domains.map((d) => (riskCounts[d]["Low"] / studies.length) * 100),
        backgroundColor: "#22c55e",
        borderColor: "#16a34a",
        borderWidth: 1,
      },
      {
        label: "部分擔憂",
        data: domains.map(
          (d) => (riskCounts[d]["Some concerns"] / studies.length) * 100,
        ),
        backgroundColor: "#fbbf24",
        borderColor: "#f59e0b",
        borderWidth: 1,
      },
      {
        label: "高風險",
        data: domains.map(
          (d) => (riskCounts[d]["High"] / studies.length) * 100,
        ),
        backgroundColor: "#ef4444",
        borderColor: "#dc2626",
        borderWidth: 1,
      },
    ],
  };

  currentChart = new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: "Risk of Bias Summary Plot",
          font: { size: 16, weight: "bold" },
        },
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.x.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
          title: {
            display: true,
            text: "研究比例",
          },
        },
        y: {
          stacked: true,
        },
      },
    },
  });
}

function createWeightedBarChart(ctx, studies) {
  const domains = [
    "randomization",
    "deviations",
    "missing",
    "measurement",
    "selection",
    "overall",
  ];
  const domainLabels = {
    randomization: "Bias arising from the randomization process",
    deviations: "Bias due to deviations from intended interventions",
    missing: "Bias due to missing outcome data",
    measurement: "Bias in measurement of the outcome",
    selection: "Bias in selection of the reported result",
    overall: "Overall risk of bias",
  };

  // Calculate risk counts for each domain
  const riskData = domains.map((domain) => {
    const counts = { Low: 0, "Some concerns": 0, High: 0 };

    studies.forEach((study) => {
      const risk =
        domain === "overall"
          ? study.overallRisk
          : getAssessmentData(study, domain);
      if (counts[risk] !== undefined) {
        counts[risk]++;
      }
    });

    const total = studies.length;
    const result = {
      domain: domainLabels[domain],
      low: (counts["Low"] / total) * 100,
      concerns: (counts["Some concerns"] / total) * 100,
      high: (counts["High"] / total) * 100,
    };
    return result;
  });

  const data = {
    labels: riskData.map((d) => d.domain),
    datasets: [
      {
        label: "Low risk of bias",
        data: riskData.map((d) => d.low),
        backgroundColor: "#4CAF50",
        borderColor: "#4CAF50",
        borderWidth: 0,
      },
      {
        label: "Some concerns",
        data: riskData.map((d) => d.concerns),
        backgroundColor: "#FFC107",
        borderColor: "#FFC107",
        borderWidth: 0,
      },
      {
        label: "High risk of bias",
        data: riskData.map((d) => d.high),
        backgroundColor: "#F44336",
        borderColor: "#F44336",
        borderWidth: 0,
      },
    ],
  };

  currentChart = new Chart(ctx, {
    type: "bar",
    data: data,
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false,
        },
        legend: {
          display: true,
          position: "bottom",
          labels: {
            boxWidth: 20,
            padding: 15,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${context.parsed.x.toFixed(1)}%`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
          },
          grid: {
            display: true,
          },
        },
        y: {
          stacked: true,
          ticks: {
            maxRotation: 0,
            font: {
              size: 11,
            },
          },
          grid: {
            display: false,
          },
        },
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10,
        },
      },
    },
  });
}

async function exportChart(format) {
  // 動態載入 html2canvas（如果需要）
  if (!window.html2canvas && window.loadHtml2Canvas)
    await window.loadHtml2Canvas();
  // Check if we have any studies to export
  const completedStudies = robSystem.studies.filter(
    (study) => study.overallRisk,
  );
  if (completedStudies.length === 0) {
    alert("請先完成研究評估才能匯出圖表");
    return;
  }

  if (format === "png") {
    if (currentChartType === "weighted-bar" && currentChart) {
      // Use Chart.js built-in toBase64Image method for bar charts
      const dataURL = currentChart.toBase64Image("image/png", 1.0);
      const a = document.createElement("a");
      a.href = dataURL;
      a.download = `rob-chart-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // For traffic-light plots, use html2canvas to capture the table
      const tableElement = document.getElementById("rob-chart-table");
      if (tableElement && window.html2canvas) {
        html2canvas(tableElement, {
          backgroundColor: "#ffffff",
          scale: 2,
        }).then((canvas) => {
          canvas.toBlob(function (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `rob-chart-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          });
        });
      } else {
        alert("無法匯出此類型的圖表，請嘗試切換到柱狀圖模式");
      }
    }
  } else if (format === "svg") {
    // Generate SVG representation of the chart
    const svgString = generateSVGFromChart();
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rob-chart-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

function generateSVGFromChart() {
  const studies = robSystem.studies.filter((study) => study.overallRisk);
  const width = 800;
  const height = Math.max(400, 80 + studies.length * 40);

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;
  svg += `<rect width="${width}" height="${height}" fill="white"/>`;

  // Title
  svg += `<text x="${width / 2}" y="30" text-anchor="middle" font-size="20" font-weight="bold" fill="#333">Risk of Bias Assessment</text>`;

  if (studies.length === 0) {
    svg += `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-size="14" fill="#666">No completed assessments</text>`;
    svg += `</svg>`;
    return svg;
  }

  // Headers
  const headerY = 70;
  svg += `<text x="50" y="${headerY}" font-size="14" font-weight="bold" fill="#333">Study</text>`;

  const domains = ["D1", "D2", "D3", "D4", "D5", "Overall"];
  const columnWidth = 80;
  const startX = 300;

  domains.forEach((domain, index) => {
    const x = startX + index * columnWidth;
    svg += `<text x="${x}" y="${headerY}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">${domain}</text>`;
  });

  // Studies data
  studies.forEach((study, studyIndex) => {
    const y = 100 + studyIndex * 40;

    // Study name
    const studyName = `${escapeHTML(study.authors || study.author || "Unknown")} ${escapeHTML(study.year || "")}`;
    svg += `<text x="50" y="${y}" font-size="12" fill="#333">${escapeHTML(studyName.substring(0, 25))}${studyName.length > 25 ? "..." : ""}</text>`;

    // Domain assessments
    const domainKeys = [
      "randomization",
      "deviations",
      "missing",
      "measurement",
      "selection",
    ];
    domainKeys.forEach((domainKey, domainIndex) => {
      const x = startX + domainIndex * columnWidth;
      const assessment = getAssessmentData(study, domainKey);

      let color = "#ccc";
      let symbol = "?";

      if (assessment) {
        if (assessment === "Low") {
          color = "#22c55e";
          symbol = "+";
        } else if (assessment === "Some concerns") {
          color = "#fbbf24";
          symbol = "!";
        } else if (assessment === "High") {
          color = "#ef4444";
          symbol = "X";
        }
      }

      svg += `<circle cx="${x}" cy="${y - 5}" r="12" fill="${color}" stroke="#333" stroke-width="1"/>`;
      svg += `<text x="${x}" y="${y}" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${symbol}</text>`;
    });

    // Overall risk
    const overallX = startX + 5 * columnWidth;
    let overallColor = "#ccc";
    let overallSymbol = "?";

    if (study.overallRisk === "Low") {
      overallColor = "#22c55e";
      overallSymbol = "+";
    } else if (study.overallRisk === "Some concerns") {
      overallColor = "#fbbf24";
      overallSymbol = "!";
    } else if (study.overallRisk === "High") {
      overallColor = "#ef4444";
      overallSymbol = "X";
    }

    svg += `<circle cx="${overallX}" cy="${y - 5}" r="12" fill="${overallColor}" stroke="#333" stroke-width="2"/>`;
    svg += `<text x="${overallX}" y="${y}" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${overallSymbol}</text>`;
  });

  // Legend
  const legendY = height - 60;
  svg += `<text x="50" y="${legendY}" font-size="14" font-weight="bold" fill="#333">Legend:</text>`;

  const legendItems = [
    { color: "#22c55e", symbol: "+", text: "Low risk" },
    { color: "#fbbf24", symbol: "!", text: "Some concerns" },
    { color: "#ef4444", symbol: "X", text: "High risk" },
    { color: "#ccc", symbol: "?", text: "Not assessed" },
  ];

  legendItems.forEach((item, index) => {
    const x = 150 + index * 120;
    svg += `<circle cx="${x}" cy="${legendY - 8}" r="10" fill="${item.color}" stroke="#333" stroke-width="1"/>`;
    svg += `<text x="${x}" y="${legendY - 4}" text-anchor="middle" font-size="10" font-weight="bold" fill="white">${item.symbol}</text>`;
    svg += `<text x="${x + 20}" y="${legendY - 4}" font-size="11" fill="#333">${item.text}</text>`;
  });

  svg += `</svg>`;
  return svg;
}
