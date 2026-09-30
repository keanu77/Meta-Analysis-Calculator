// Module B: Two-group Comparisons & Effect Sizes
// Two-group results report 95% Wald intervals with the exact normal quantile.
const Z_95 = getCriticalValueZ(95);

function calculateMD() {
  const mean1 = readNumber("md-mean1");
  const sd1 = readNumber("md-sd1");
  const n1 = readNumber("md-n1");
  const mean2 = readNumber("md-mean2");
  const sd2 = readNumber("md-sd2");
  const n2 = readNumber("md-n2");
  const resultDiv = document.getElementById("md-result");

  if (!allFinite(mean1, sd1, mean2, sd2)) {
    showError(resultDiv, "請輸入所有必要的數值（均值和標準差）");
    return;
  }
  if (![n1, n2].every((x) => isSampleSize(x))) {
    showError(resultDiv, "樣本大小必須為正整數");
    return;
  }
  if (sd1 < 0 || sd2 < 0) {
    showError(resultDiv, "標準差不能為負數");
    return;
  }

  const md = mean1 - mean2;
  const seMD = Math.sqrt(sd1 ** 2 / n1 + sd2 ** 2 / n2);
  if (!(seMD > 0) || !Number.isFinite(seMD)) {
    showError(resultDiv, "無法計算標準誤：兩組標準差不可同時為 0");
    return;
  }

  const ci95Lower = md - Z_95 * seMD;
  const ci95Upper = md + Z_95 * seMD;
  const zValue = md / seMD;
  const pValue = twoSidedPFromZ(zValue);

  addToHistory({
    calculation: "Mean Difference (MD)",
    inputs: { mean1, sd1, n1, mean2, sd2, n2 },
    outputs: { MD: md, SE: seMD, CI95_lower: ci95Lower, CI95_upper: ci95Upper, Z: zValue, p: pValue },
    formula: "MD = Mean₁ - Mean₂; SE(MD) = √(SD₁²/n₁ + SD₂²/n₂)",
    reference: "Cochrane Handbook §6.5.1.1",
  });
  displayResult(
    resultDiv,
    `Mean Difference = ${md.toFixed(4)}\n` +
      `SE(MD) = ${seMD.toFixed(4)}\n` +
      `95% CI = [${ci95Lower.toFixed(4)}, ${ci95Upper.toFixed(4)}]\n` +
      `Z = ${zValue.toFixed(4)}\n` +
      `p-value = ${formatP(pValue)}\n\n` +
      `計算步驟：\n` +
      `MD = ${fmt(mean1)} - ${fmt(mean2)} = ${md.toFixed(4)}\n` +
      `SE(MD) = √(${fmt(sd1)}²/${n1} + ${fmt(sd2)}²/${n2}) = ${seMD.toFixed(4)}\n` +
      `95% CI = ${md.toFixed(4)} ± ${Z_95.toFixed(4)} × ${seMD.toFixed(4)}\n\n` +
      `CI 與 p 值為常態（Wald）近似；小樣本時原文若用 t 檢定，數值會略有差異。`,
  );
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

  if (!allFinite(mean1, sd1, mean2, sd2) || sd1 < 0 || sd2 < 0) {
    showError(resultDiv, "請輸入所有必要的數值，標準差不能為負數");
    return;
  }
  if (![n1, n2].every((x) => isSampleSize(x, 2))) {
    showError(resultDiv, "每組樣本數必須為 ≥ 2 的整數");
    return;
  }

  const pooledSD = Math.sqrt(((n1 - 1) * sd1 ** 2 + (n2 - 1) * sd2 ** 2) / (n1 + n2 - 2));
  if (!Number.isFinite(pooledSD) || pooledSD <= 0) {
    showError(resultDiv, "合併標準差必須大於 0 且為有限數值，才能計算 SMD");
    return;
  }

  const total = n1 + n2;
  const df = total - 2;
  const cohensD = (mean1 - mean2) / pooledSD;
  const seD = Math.sqrt(total / (n1 * n2) + cohensD ** 2 / (2 * total));
  // Hedges' small-sample factor; Var(g) = J² × Var(d) (Borenstein 2009, eq. 4.24).
  const j = 1 - 3 / (4 * df - 1);
  const estimate = useCorrection ? cohensD * j : cohensD;
  const se = useCorrection ? j * seD : seD;
  const ci95Lower = estimate - Z_95 * se;
  const ci95Upper = estimate + Z_95 * se;
  const zValue = estimate / se;
  const pValue = twoSidedPFromZ(zValue);
  const label = useCorrection ? "g" : "d";

  addToHistory({
    calculation: "Standardized Mean Difference (SMD)",
    inputs: { mean1, sd1, n1, mean2, sd2, n2, useCorrection },
    outputs: {
      cohensD,
      hedgesG: useCorrection ? estimate : null,
      pooledSD,
      SE: se,
      CI95_lower: ci95Lower,
      CI95_upper: ci95Upper,
      Z: zValue,
      p: pValue,
      J: useCorrection ? j : null,
    },
    formula: useCorrection
      ? "g = J × d, J = 1 − 3/(4df − 1); SE(g) = J × √[(n₁+n₂)/(n₁n₂) + d²/(2(n₁+n₂))]"
      : "d = (Mean₁ − Mean₂)/Pooled SD; SE(d) = √[(n₁+n₂)/(n₁n₂) + d²/(2(n₁+n₂))]",
    reference: "Borenstein et al. (2009) Introduction to Meta-Analysis, ch. 4",
  });
  displayResult(
    resultDiv,
    `Cohen's d = ${cohensD.toFixed(4)}\n` +
      `${useCorrection ? `Hedges' g = ${estimate.toFixed(4)}\n` : ""}` +
      `Pooled SD = ${pooledSD.toFixed(4)}\n` +
      `SE(${label}) = ${se.toFixed(4)}\n` +
      `95% CI = [${ci95Lower.toFixed(4)}, ${ci95Upper.toFixed(4)}]\n` +
      `Z = ${zValue.toFixed(4)}\n` +
      `p-value = ${formatP(pValue)}\n\n` +
      `計算步驟：\n` +
      `Pooled SD = √[((${n1}-1)×${fmt(sd1)}² + (${n2}-1)×${fmt(sd2)}²) / (${n1}+${n2}-2)] = ${pooledSD.toFixed(4)}\n` +
      `Cohen's d = (${fmt(mean1)} - ${fmt(mean2)}) / ${pooledSD.toFixed(4)} = ${cohensD.toFixed(4)}\n` +
      `SE(d) = √[${total}/(${n1}×${n2}) + d²/(2×${total})] = ${seD.toFixed(4)}\n` +
      (useCorrection
        ? `J = 1 - 3/(4×${df}-1) = ${j.toFixed(4)}\n` +
          `Hedges' g = ${cohensD.toFixed(4)} × ${j.toFixed(4)} = ${estimate.toFixed(4)}\n` +
          `SE(g) = J × SE(d) = ${se.toFixed(4)}\n`
        : "") +
      `\n不同軟體的 SE(g) 近似式略有差異（例如 RevMan 用 g²/(2(N−3.94))），小樣本時差距約數個百分點。`,
  );
}

// Relative effects (OR, RR) on the log scale from a 2×2 table.
function relativeEffects(a, b, c, d) {
  const or = (a * d) / (b * c);
  const seLogOR = Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d);
  const rr = a / (a + b) / (c / (c + d));
  const seLogRR = Math.sqrt(1 / a - 1 / (a + b) + 1 / c - 1 / (c + d));
  const interval = (ratio, se) => [Math.exp(Math.log(ratio) - Z_95 * se), Math.exp(Math.log(ratio) + Z_95 * se)];
  return {
    OR: or, logOR: Math.log(or), SE_logOR: seLogOR, OR_CI95: interval(or, seLogOR),
    RR: rr, logRR: Math.log(rr), SE_logRR: seLogRR, RR_CI95: interval(rr, seLogRR),
  };
}

const NOT_ESTIMABLE = {
  OR: null, logOR: null, SE_logOR: null, OR_CI95: null,
  RR: null, logRR: null, SE_logRR: null, RR_CI95: null,
};

function formatCount(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
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
    events1 > total1 || events2 > total2
  ) {
    showError(resultDiv, "請輸入有效的事件數和總數");
    return;
  }
  if (!["haldane", "none"].includes(correction)) {
    showError(resultDiv, "未知的零格修正方法");
    return;
  }

  const a = events1;
  const b = total1 - events1;
  const c = events2;
  const d = total2 - events2;
  const hasZeroCell = [a, b, c, d].includes(0);
  // Both arms with no events (or all events): no information on relative effects.
  const uninformative = (a === 0 && c === 0) || (b === 0 && d === 0);
  const corrected = hasZeroCell && correction === "haldane" && !uninformative;
  const k = corrected ? 0.5 : 0;

  let relative = NOT_ESTIMABLE;
  let relativeNote = "";
  if (uninformative) {
    relativeNote = a === 0
      ? "兩組皆無事件：OR/RR 無法估計（此研究對相對效果不提供資訊，Cochrane 建議 OR/RR 統合分析時排除）。"
      : "兩組皆全部發生事件：OR/RR 無法估計（此研究對相對效果不提供資訊）。";
  } else if (hasZeroCell && !corrected) {
    relativeNote = "2×2 表含零格且未修正：OR/RR 無法估計。可改選 Haldane-Anscombe 修正，或在統合分析時改用 Peto／Mantel-Haenszel 等方法。";
  } else {
    relative = relativeEffects(a + k, b + k, c + k, d + k);
  }

  // Risk difference from the observed counts; no zero-cell correction needed.
  const p1 = a / total1;
  const p2 = c / total2;
  const rd = p1 - p2;
  const seRD = Math.sqrt((p1 * (1 - p1)) / total1 + (p2 * (1 - p2)) / total2);
  const rdCI = [rd - Z_95 * seRD, rd + Z_95 * seRD];

  addToHistory({
    calculation: "Binary Outcomes (OR/RR/RD)",
    inputs: { events1, total1, events2, total2, correction, correctionApplied: corrected },
    outputs: { ...relative, RD: rd, SE_RD: seRD, RD_CI95: rdCI, p1, p2 },
    formula: "OR = (a×d)/(b×c); RR = (a/(a+b))/(c/(c+d)); RD = p₁ - p₂",
    reference: "Cochrane Handbook §6.4, §10.4.4",
  });

  const cells = [a + k, b + k, c + k, d + k].map(formatCount);
  const relativeText = relative.OR === null
    ? `Odds Ratio：無法估計\nRisk Ratio：無法估計\n${relativeNote}\n\n`
    : `Odds Ratio = ${relative.OR.toFixed(4)}\n` +
      `log(OR) = ${relative.logOR.toFixed(4)}，SE = ${relative.SE_logOR.toFixed(4)}\n` +
      `95% CI = [${relative.OR_CI95[0].toFixed(4)}, ${relative.OR_CI95[1].toFixed(4)}]\n\n` +
      `Risk Ratio = ${relative.RR.toFixed(4)}\n` +
      `log(RR) = ${relative.logRR.toFixed(4)}，SE = ${relative.SE_logRR.toFixed(4)}\n` +
      `95% CI = [${relative.RR_CI95[0].toFixed(4)}, ${relative.RR_CI95[1].toFixed(4)}]\n\n`;
  displayResult(
    resultDiv,
    `${corrected ? "OR/RR 已套用 Haldane-Anscombe 修正（每格 +0.5）；RD 使用原始計數\n\n" : ""}` +
      `2×2 表格${corrected ? "（OR/RR 用，已修正）" : ""}：\n` +
      `           事件    非事件\n` +
      `實驗組      ${cells[0]}     ${cells[1]}\n` +
      `對照組      ${cells[2]}     ${cells[3]}\n\n` +
      relativeText +
      `Risk Difference = ${rd.toFixed(4)}（p₁ = ${p1.toFixed(4)}，p₂ = ${p2.toFixed(4)}）\n` +
      `SE(RD) = ${seRD.toFixed(4)}\n` +
      `95% CI = [${rdCI[0].toFixed(4)}, ${rdCI[1].toFixed(4)}]（Wald 近似）`,
  );
}
