// Module B: Two-group Comparisons & Effect Sizes
function calculateMD() {
  const resultDiv = document.getElementById("md-result");

  try {
    const mean1 = readNumber("md-mean1");
    const sd1 = readNumber("md-sd1");
    const n1 = readNumber("md-n1");
    const mean2 = readNumber("md-mean2");
    const sd2 = readNumber("md-sd2");
    const n2 = readNumber("md-n2");

    // Enhanced input validation
    if (!allFinite(mean1, sd1, mean2, sd2)) {
      showError(resultDiv, "請輸入所有必要的數值（均值和標準差）");
      return;
    }

    if (![n1, n2].every((x) => isSampleSize(x))) {
      showError(resultDiv, "樣本大小必須為正整數");
      return;
    }

    if ([sd1, sd2].some((x) => x < 0)) {
      showError(resultDiv, "標準差不能為負數");
      return;
    }

    if ([sd1, sd2].some((x) => x === 0)) {
      showError(resultDiv, "警告：標準差為0可能導致計算問題");
    }

    const md = mean1 - mean2;
    const seMD = Math.sqrt(sd1 ** 2 / n1 + sd2 ** 2 / n2);

    // Check for division by zero or invalid SE
    if (seMD === 0 || !isFinite(seMD)) {
      showError(resultDiv, "無法計算標準誤：檢查輸入數據");
      return;
    }

    const ci95Lower = md - 1.96 * seMD;
    const ci95Upper = md + 1.96 * seMD;
    const zValue = md / seMD;
    const pValue = 2 * (1 - normalCDF(Math.abs(zValue)));

    // Validate results
    if (
      !isFinite(md) ||
      !isFinite(ci95Lower) ||
      !isFinite(ci95Upper) ||
      !isFinite(zValue) ||
      !isFinite(pValue)
    ) {
      showError(resultDiv, "計算結果無效，請檢查輸入數據");
      return;
    }

    const result = {
      calculation: "Mean Difference (MD)",
      inputs: { mean1, sd1, n1, mean2, sd2, n2 },
      outputs: {
        MD: md,
        SE: seMD,
        CI95_lower: ci95Lower,
        CI95_upper: ci95Upper,
        Z: zValue,
        p: pValue,
      },
      formula: "MD = Mean₁ - Mean₂; SE(MD) = √(SD₁²/n₁ + SD₂²/n₂)",
      reference: "Standard mean difference calculation",
    };

    displayResult(
      resultDiv,
      `Mean Difference = ${md.toFixed(4)}\n` +
        `SE(MD) = ${seMD.toFixed(4)}\n` +
        `95% CI = [${ci95Lower.toFixed(4)}, ${ci95Upper.toFixed(4)}]\n` +
        `Z = ${zValue.toFixed(4)}\n` +
        `p-value = ${pValue.toFixed(6)}\n\n` +
        `計算步驟：\n` +
        `MD = ${mean1} - ${mean2} = ${md.toFixed(4)}\n` +
        `SE(MD) = √(${sd1}²/${n1} + ${sd2}²/${n2}) = ${seMD.toFixed(4)}\n` +
        `95% CI = ${md.toFixed(4)} ± 1.96 × ${seMD.toFixed(4)}`,
    );
    addToHistory(result);
  } catch (error) {
    console.error("Error in calculateMD:", error);
    showError(resultDiv, "計算過程中發生錯誤，請檢查輸入數據格式");
  }
}

// Standardized Mean Difference calculation
function calculateSMD() {
  const mean1 = readNumber("smd-mean1");
  const sd1 = readNumber("smd-sd1");
  const n1 = readNumber("smd-n1");
  const mean2 = readNumber("smd-mean2");
  const sd2 = readNumber("smd-sd2");
  const n2 = readNumber("smd-n2");
  const useCorrection = document.getElementById("smd-correction").checked;
  const resultDiv = document.getElementById("smd-result");

  if (
    !allFinite(mean1, sd1, mean2, sd2) || sd1 < 0 || sd2 < 0 ||
    ![n1, n2].every((x) => isSampleSize(x)) || n1 + n2 <= 2
  ) {
    showError(resultDiv, "請輸入所有必要的數值");
    return;
  }

  // Calculate pooled standard deviation
  const pooledSD = Math.sqrt(
    ((n1 - 1) * sd1 ** 2 + (n2 - 1) * sd2 ** 2) / (n1 + n2 - 2),
  );
  if (!Number.isFinite(pooledSD) || pooledSD <= 0) {
    showError(resultDiv, "合併標準差必須大於 0 且為有限數值，才能計算 SMD");
    return;
  }

  // Calculate Cohen's d
  const cohensD = (mean1 - mean2) / pooledSD;

  // Calculate Hedges' g (small sample correction)
  const df = n1 + n2 - 2;
  const j = 1 - 3 / (4 * df - 1);
  const hedgesG = useCorrection ? cohensD * j : cohensD;

  // Calculate SE(g)
  const seG = Math.sqrt((n1 + n2) / (n1 * n2) + hedgesG ** 2 / (2 * (n1 + n2)));

  // Calculate 95% CI
  const ci95Lower = hedgesG - 1.96 * seG;
  const ci95Upper = hedgesG + 1.96 * seG;

  // Calculate Z and p-value
  const zValue = hedgesG / seG;
  const pValue = 2 * (1 - normalCDF(Math.abs(zValue)));

  const result = {
    calculation: "Standardized Mean Difference (SMD)",
    inputs: { mean1, sd1, n1, mean2, sd2, n2, useCorrection },
    outputs: {
      cohensD: cohensD,
      hedgesG: hedgesG,
      pooledSD: pooledSD,
      SE: seG,
      CI95_lower: ci95Lower,
      CI95_upper: ci95Upper,
      Z: zValue,
      p: pValue,
      J: j,
    },
    formula: useCorrection
      ? "Hedges g = Cohen's d × J, where J = 1 - 3/(4df-1)"
      : "Cohen's d = (Mean₁ - Mean₂) / Pooled SD",
    reference: "Hedges & Olkin (1985) statistical methods",
  };

  displayResult(
    resultDiv,
    `Cohen's d = ${cohensD.toFixed(4)}\n` +
      `${useCorrection ? `Hedges' g = ${hedgesG.toFixed(4)}\n` : ""}` +
      `Pooled SD = ${pooledSD.toFixed(4)}\n` +
      `SE(${useCorrection ? "g" : "d"}) = ${seG.toFixed(4)}\n` +
      `95% CI = [${ci95Lower.toFixed(4)}, ${ci95Upper.toFixed(4)}]\n` +
      `Z = ${zValue.toFixed(4)}\n` +
      `p-value = ${pValue.toFixed(6)}\n\n` +
      `計算步驟：\n` +
      `Pooled SD = √[((${n1}-1)×${sd1}² + (${n2}-1)×${sd2}²) / (${n1}+${n2}-2)] = ${pooledSD.toFixed(4)}\n` +
      `Cohen's d = (${mean1} - ${mean2}) / ${pooledSD.toFixed(4)} = ${cohensD.toFixed(4)}\n` +
      `${useCorrection ? `J = 1 - 3/(4×${df}-1) = ${j.toFixed(4)}\nHedges' g = ${cohensD.toFixed(4)} × ${j.toFixed(4)} = ${hedgesG.toFixed(4)}\n` : ""}`,
  );
  addToHistory(result);
}

// Binary outcomes calculation (OR, RR, RD)
function calculateBinaryOutcomes() {
  const events1 = readNumber("bin-events1");
  const total1 = readNumber("bin-total1");
  const events2 = readNumber("bin-events2");
  const total2 = readNumber("bin-total2");
  const correction = document.getElementById("bin-correction").value;
  const resultDiv = document.getElementById("binary-result");

  if (
    !isSampleSize(events1, 0) || !isSampleSize(events2, 0) ||
    !isSampleSize(total1) || !isSampleSize(total2) ||
    events1 > total1 ||
    events2 > total2
  ) {
    showError(resultDiv, "請輸入有效的事件數和總數");
    return;
  }

  // Apply zero event correction if needed
  let a = events1,
    b = total1 - events1,
    c = events2,
    d = total2 - events2;
  let correctionApplied = false;

  if ([a, b, c, d].some((cell) => cell === 0) && correction === "none") {
    showError(resultDiv, "2×2 表含零格且未使用修正，現有 OR/RR 對數公式無法產生完整有限結果；請確認分析方法。");
    return;
  }

  if ((a === 0 || b === 0 || c === 0 || d === 0) && correction !== "none") {
    correctionApplied = true;
    if (correction === "haldane") {
      a += 0.5;
      b += 0.5;
      c += 0.5;
      d += 0.5;
    } else if (correction === "continuity") {
      const corrValue = 0.5;
      a += corrValue;
      b += corrValue;
      c += corrValue;
      d += corrValue;
    }
  }

  // Calculate proportions
  const p1 = a / (a + b);
  const p2 = c / (c + d);

  // Calculate Odds Ratio
  const or = (a * d) / (b * c);
  const logOR = Math.log(or);
  const seLogOR = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const orCI95Lower = Math.exp(logOR - 1.96 * seLogOR);
  const orCI95Upper = Math.exp(logOR + 1.96 * seLogOR);

  // Calculate Risk Ratio
  const rr = p1 / p2;
  const logRR = Math.log(rr);
  const seLogRR = Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
  const rrCI95Lower = Math.exp(logRR - 1.96 * seLogRR);
  const rrCI95Upper = Math.exp(logRR + 1.96 * seLogRR);

  // Calculate Risk Difference
  const rd = p1 - p2;
  const seRD = Math.sqrt((p1 * (1 - p1)) / (a + b) + (p2 * (1 - p2)) / (c + d));
  const rdCI95Lower = rd - 1.96 * seRD;
  const rdCI95Upper = rd + 1.96 * seRD;

  const result = {
    calculation: "Binary Outcomes (OR/RR/RD)",
    inputs: {
      events1: events1,
      total1: total1,
      events2: events2,
      total2: total2,
      correction: correction,
      correctionApplied: correctionApplied,
    },
    outputs: {
      OR: or,
      logOR: logOR,
      SE_logOR: seLogOR,
      OR_CI95: [orCI95Lower, orCI95Upper],
      RR: rr,
      logRR: logRR,
      SE_logRR: seLogRR,
      RR_CI95: [rrCI95Lower, rrCI95Upper],
      RD: rd,
      SE_RD: seRD,
      RD_CI95: [rdCI95Lower, rdCI95Upper],
      p1: p1,
      p2: p2,
    },
    formula: "OR = (a×d)/(b×c); RR = (a/(a+b))/(c/(c+d)); RD = p₁ - p₂",
    reference: "Standard 2×2 table analysis",
  };

  displayResult(
    resultDiv,
    `${correctionApplied ? `零事件修正已應用 (${correction})\n\n` : ""}` +
      `2×2 表格：\n` +
      `           事件    非事件   總計    比例\n` +
      `實驗組      ${a.toFixed(1)}     ${b.toFixed(1)}      ${(a + b).toFixed(1)}    ${p1.toFixed(4)}\n` +
      `對照組      ${c.toFixed(1)}     ${d.toFixed(1)}      ${(c + d).toFixed(1)}    ${p2.toFixed(4)}\n\n` +
      `Odds Ratio = ${or.toFixed(4)}\n` +
      `log(OR) = ${logOR.toFixed(4)} ± ${seLogOR.toFixed(4)}\n` +
      `95% CI = [${orCI95Lower.toFixed(4)}, ${orCI95Upper.toFixed(4)}]\n\n` +
      `Risk Ratio = ${rr.toFixed(4)}\n` +
      `log(RR) = ${logRR.toFixed(4)} ± ${seLogRR.toFixed(4)}\n` +
      `95% CI = [${rrCI95Lower.toFixed(4)}, ${rrCI95Upper.toFixed(4)}]\n\n` +
      `Risk Difference = ${rd.toFixed(4)}\n` +
      `SE(RD) = ${seRD.toFixed(4)}\n` +
      `95% CI = [${rdCI95Lower.toFixed(4)}, ${rdCI95Upper.toFixed(4)}]`,
  );
  addToHistory(result);
}
