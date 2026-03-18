// PDF Export Module
async function exportPDF() {
  // 動態載入 jsPDF 和 html2canvas
  if (!window.jspdf && window.loadJsPDF) await window.loadJsPDF();
  if (!window.html2canvas && window.loadHtml2Canvas)
    await window.loadHtml2Canvas();
  const { jsPDF } = window.jspdf;
  const completedStudies = robSystem.studies.filter(
    (study) => study.overallRisk,
  );

  if (completedStudies.length === 0) {
    alert("沒有已完成的評估可以匯出");
    return;
  }

  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text("Risk of Bias 2.0 Assessment Report", 105, 20, { align: "center" });

  // Date
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Generated: ${new Date().toLocaleDateString("zh-TW")}`, 105, 30, {
    align: "center",
  });

  // Studies summary
  let yPosition = 50;
  doc.setFontSize(14);
  doc.setFont(undefined, "bold");
  doc.text("Studies Assessed:", 20, yPosition);

  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont(undefined, "normal");

  completedStudies.forEach((study, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Study header
    doc.setFont(undefined, "bold");
    doc.text(`${index + 1}. ${study.title}`, 20, yPosition);
    yPosition += 7;

    doc.setFont(undefined, "normal");
    doc.text(
      `Author: ${study.authors || study.author || "Unknown"}, Year: ${study.year || "Unknown"}`,
      25,
      yPosition,
    );
    yPosition += 7;

    // Domain risks
    const domains = [
      "randomization",
      "deviations",
      "missing",
      "measurement",
      "selection",
    ];
    const domainNames = {
      randomization: "Randomization",
      deviations: "Deviations",
      missing: "Missing data",
      measurement: "Measurement",
      selection: "Selection",
    };

    domains.forEach((domain) => {
      const risk = getAssessmentData(study, domain) || "Not assessed";
      const riskText =
        risk === "Low"
          ? "Low risk"
          : risk === "Some concerns"
            ? "Some concerns"
            : risk === "High"
              ? "High risk"
              : risk;

      // Set color based on risk
      if (risk === "low") doc.setTextColor(34, 197, 94);
      else if (risk === "some-concerns") doc.setTextColor(251, 191, 36);
      else if (risk === "high") doc.setTextColor(239, 68, 68);
      else doc.setTextColor(0, 0, 0);

      doc.text(`  - ${domainNames[domain]}: ${riskText}`, 25, yPosition);
      yPosition += 6;
    });

    // Overall risk
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`  Overall Risk: `, 25, yPosition);

    const overallRisk = study.overallRisk;
    if (overallRisk === "low") doc.setTextColor(34, 197, 94);
    else if (overallRisk === "some-concerns") doc.setTextColor(251, 191, 36);
    else if (overallRisk === "high") doc.setTextColor(239, 68, 68);

    const overallText =
      overallRisk === "low"
        ? "Low risk"
        : overallRisk === "some-concerns"
          ? "Some concerns"
          : "High risk";
    doc.text(overallText, 55, yPosition);

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, "normal");
    yPosition += 12;
  });

  // Add chart if exists
  if (currentChartType === "weighted-bar" && currentChart) {
    // For Chart.js bar charts
    const canvas = document.getElementById("rob-chart");
    html2canvas(canvas).then((canvasImage) => {
      const imgData = canvasImage.toDataURL("image/png");
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Risk of Bias Visualization", 105, 20, { align: "center" });
      doc.addImage(imgData, "PNG", 15, 30, 180, 100);

      // Save the PDF
      doc.save(`rob-assessment-${Date.now()}.pdf`);
    });
  } else if (currentChartType === "traffic-light") {
    // For traffic-light table
    const tableElement = document.getElementById("rob-chart-table");
    if (tableElement && window.html2canvas) {
      html2canvas(tableElement, {
        backgroundColor: "#ffffff",
        scale: 1,
      }).then((canvasImage) => {
        const imgData = canvasImage.toDataURL("image/png");
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont(undefined, "bold");
        doc.text("Risk of Bias Visualization", 105, 20, { align: "center" });
        doc.addImage(imgData, "PNG", 15, 30, 180, 100);

        // Save the PDF
        doc.save(`rob-assessment-${Date.now()}.pdf`);
      });
    } else {
      // Save without chart
      doc.save(`rob-assessment-${Date.now()}.pdf`);
    }
  } else {
    // Save without chart
    doc.save(`rob-assessment-${Date.now()}.pdf`);
  }
}
