// Module A: Within-group & Descriptive Statistics Conversion
function calculateSEtoSD() {
  const se = readNumber("se-input");
  const n = readNumber("se-n-input");
  const resultDiv = document.getElementById("se-sd-result");

  if (!Number.isFinite(se) || se < 0 || !isSampleSize(n)) {
    showError(resultDiv, "SE 必須為非負有限數值，樣本數必須為正整數");
    return;
  }

  const sd = se * Math.sqrt(n);

  const result = {
    calculation: "SE to SD",
    inputs: { SE: se, n: n },
    outputs: { SD: sd },
    formula: "SD = SE × √n",
    reference: "Standard error relationship",
  };

  displayResult(
    resultDiv,
    `SD = ${sd.toFixed(4)}\n\n計算步驟：\nSD = ${se} × √${n}\nSD = ${se} × ${Math.sqrt(n).toFixed(4)}\nSD = ${sd.toFixed(4)}\n\n適用：單組平均值的 SE。兩組差值 (MD) 的 SE 請改用 SD = SE / √(1/n₁ + 1/n₂)。`,
  );
  addToHistory(result);
}

// CI to Mean & SD conversion
function calculateCItoMeanSD() {
  const lowerCI = readNumber("ci-lower");
  const upperCI = readNumber("ci-upper");
  const ciLevel = parseInt(document.getElementById("ci-level").value);
  const n = readNumber("ci-n");
  const distribution = document.getElementById("ci-distribution").value;
  const resultDiv = document.getElementById("ci-mean-sd-result");

  if (!allFinite(lowerCI, upperCI) || !isSampleSize(n, 2) || lowerCI >= upperCI) {
    showError(resultDiv, "請輸入有效的信賴區間界限（下界 < 上界）和 ≥ 2 的整數樣本數");
    return;
  }
  if (!["auto", "normal", "t"].includes(distribution)) {
    showError(resultDiv, "未知的分布選項");
    return;
  }

  // Calculate mean
  const mean = (lowerCI + upperCI) / 2;

  // Calculate critical value based on distribution selection
  let criticalValue;
  let distributionUsed;

  if (distribution === "auto") {
    // Automatically choose distribution based on sample size
    // Use t-distribution for n < 120, normal distribution for n >= 120
    if (n < 120) {
      criticalValue = getCriticalValueT(ciLevel, n - 1);
      distributionUsed = `t-distribution (df=${n - 1})`;
    } else {
      criticalValue = getCriticalValueZ(ciLevel);
      distributionUsed = "Normal (Z)";
    }
  } else if (distribution === "normal") {
    criticalValue = getCriticalValueZ(ciLevel);
    distributionUsed = "Normal (Z)";
  } else if (distribution === "t") {
    criticalValue = getCriticalValueT(ciLevel, n - 1);
    distributionUsed = `t-distribution (df=${n - 1})`;
  }

  // Calculate SE and SD
  const se = (upperCI - lowerCI) / (2 * criticalValue);
  const sd = se * Math.sqrt(n);
  if (!allFinite(criticalValue, se, sd)) {
    showError(resultDiv, "數值超出可計算範圍，請檢查輸入資料");
    return;
  }

  const result = {
    calculation: "CI to Mean & SD",
    inputs: {
      lowerCI: lowerCI,
      upperCI: upperCI,
      ciLevel: ciLevel,
      n: n,
      distribution: distribution,
      distributionUsed: distributionUsed,
    },
    outputs: {
      mean: mean,
      SD: sd,
      SE: se,
      criticalValue: criticalValue,
    },
    formula:
      "Mean = (Upper + Lower)/2; SE = (Upper - Lower)/(2 × critical value); SD = SE × √n",
    reference: `${distributionUsed} critical values`,
  };

  displayResult(
    resultDiv,
    `Mean = ${mean.toFixed(4)}\nSD = ${sd.toFixed(4)}\nSE = ${se.toFixed(4)}\n\n計算步驟：\n` +
      `Mean = (${upperCI} + ${lowerCI})/2 = ${mean.toFixed(4)}\n` +
      `使用分布: ${distributionUsed}\n` +
      `Critical value (${ciLevel}%) = ${criticalValue.toFixed(4)}\n` +
      `SE = (${upperCI} - ${lowerCI})/(2 × ${criticalValue.toFixed(4)}) = ${se.toFixed(4)}\n` +
      `SD = ${se.toFixed(4)} × √${n} = ${sd.toFixed(4)}\n\n` +
      `適用：單組平均值、以平均值為中心的對稱 CI。若是兩組差值 (MD) 的 CI，不能直接用此換算。`,
  );
  addToHistory(result);
}

// Quantiles to Mean & SD conversion
const QUANTILE_FIELDS = { min: "q-min", q1: "q-q1", median: "q-median", q3: "q-q3", max: "q-max" };
const SCENARIO_LABELS = {
  S1: "S1：min、median、max",
  S2: "S2：Q1、median、Q3",
  S3: "S3：min、Q1、median、Q3、max（五數摘要）",
};

function readQuantileInputs() {
  const values = {};
  for (const [key, id] of Object.entries(QUANTILE_FIELDS)) {
    const supplied = document.getElementById(id).value.trim() !== "";
    values[key] = supplied ? readNumber(id) : undefined;
  }
  return values;
}

// Returns an error message, or null when the supplied values are usable.
function validateQuantileInputs(values, n) {
  if (!isSampleSize(n, 2)) return "樣本數必須為 ≥ 2 的整數";
  const supplied = Object.values(values).filter((value) => value !== undefined);
  if (!allFinite(...supplied)) return "分位數必須為有限數值";
  if (!Number.isFinite(values.median)) return "請輸入中位數";
  if (supplied.some((value, index) => index > 0 && value < supplied[index - 1])) {
    return "分位數必須依最小值 ≤ Q1 ≤ 中位數 ≤ Q3 ≤ 最大值排序";
  }
  if (!quantileScenario(values)) {
    return "請成對提供 min 與 max、或 Q1 與 Q3（也可兩組都提供）";
  }
  return null;
}

function calculateQuantilesToMeanSD() {
  const method = document.getElementById("quantile-method").value;
  const n = readNumber("q-n");
  const values = readQuantileInputs();
  const resultDiv = document.getElementById("quantiles-result");

  if (!["luo", "wan", "hozo"].includes(method)) {
    showError(resultDiv, "未知的計算方法");
    return;
  }
  const invalid = validateQuantileInputs(values, n);
  if (invalid) {
    showError(resultDiv, invalid);
    return;
  }
  const scenario = quantileScenario(values);
  if (method === "hozo" && scenario === "S2") {
    showError(resultDiv, "Hozo 方法需要最小值與最大值；只有 Q1/Q3 時請改用 Luo 或 Wan");
    return;
  }

  const estimate = method === "hozo"
    ? calculateHozoMethod(values.min, values.median, values.max, n)
    : estimateFromQuantiles(method, scenario, values, n);
  const { mean, sd, calculationSteps, reference } = estimate;
  if (!allFinite(mean, sd) || sd < 0) {
    showError(resultDiv, "數值超出可計算範圍，請檢查輸入資料");
    return;
  }

  const usedScenario = method === "hozo" ? "S1" : scenario;
  const ignored = method === "hozo" && scenario === "S3" ? "\n（Hozo 只使用 min、median、max，已忽略 Q1/Q3）" : "";
  addToHistory({
    calculation: `Quantiles to Mean & SD (${method}, ${usedScenario})`,
    inputs: { ...values, n, method, scenario: usedScenario },
    outputs: { mean, SD: sd },
    formula: calculationSteps,
    reference,
  });
  displayResult(
    resultDiv,
    `Mean ≈ ${mean.toFixed(4)}\nSD ≈ ${sd.toFixed(4)}\n\n` +
      `資料情境：${SCENARIO_LABELS[usedScenario]}${ignored}\n\n${calculationSteps}\n\n` +
      `參考文獻：${reference}\n\n` +
      `注意：以上為假設資料近似常態時的估計值，不是原始數據。` +
      `若中位數明顯偏離範圍或四分位距的中點（偏態），請考慮其他方法或敏感度分析。`,
  );
}

// Dedicated Hozo method calculator function
function calculateHozoOnly() {
  const min = readNumber("hozo-min");
  const median = readNumber("hozo-median");
  const max = readNumber("hozo-max");
  const n = readNumber("hozo-n");
  const resultDiv = document.getElementById("hozo-only-result");

  if (!allFinite(min, median, max) || !isSampleSize(n, 2)) {
    showError(resultDiv, "請輸入最小值、中位數、最大值，以及 ≥ 2 的整數樣本數");
    return;
  }
  if (min > median || median > max || min === max) {
    showError(resultDiv, "請確保 最小值 ≤ 中位數 ≤ 最大值，且最小值 < 最大值");
    return;
  }

  const { mean, sd, calculationSteps, reference } = calculateHozoMethod(min, median, max, n);
  addToHistory({
    calculation: "Median & Range to Mean & SD (Hozo 2005)",
    inputs: { min, median, max, n },
    outputs: { mean, SD: sd },
    formula: calculationSteps,
    reference,
  });
  displayResult(
    resultDiv,
    `平均數 (Mean) ≈ ${mean.toFixed(4)}\n標準差 (SD) ≈ ${sd.toFixed(4)}\n\n${calculationSteps}\n\n參考文獻：${reference}`,
  );
}

// Pooled SD calculation
function calculatePooledSD() {
  const sd1 = readNumber("pooled-sd1");
  const n1 = readNumber("pooled-n1");
  const sd2 = readNumber("pooled-sd2");
  const n2 = readNumber("pooled-n2");
  const resultDiv = document.getElementById("pooled-sd-result");

  if (
    !allFinite(sd1, sd2) || sd1 < 0 || sd2 < 0 ||
    !isSampleSize(n1) || !isSampleSize(n2) || n1 + n2 <= 2
  ) {
    showError(resultDiv, "請輸入有效的標準差和樣本數");
    return;
  }

  const pooledSD = Math.sqrt(
    ((n1 - 1) * sd1 ** 2 + (n2 - 1) * sd2 ** 2) / (n1 + n2 - 2),
  );

  const result = {
    calculation: "Pooled SD",
    inputs: { SD1: sd1, n1: n1, SD2: sd2, n2: n2 },
    outputs: { pooledSD: pooledSD },
    formula: "Pooled SD = √[((n₁-1)×SD₁² + (n₂-1)×SD₂²) / (n₁+n₂-2)]",
    reference: "Standard pooled variance formula",
  };

  displayResult(
    resultDiv,
    `Pooled SD = ${pooledSD.toFixed(4)}\n\n計算步驟：\n` +
      `Pooled SD = √[((${n1}-1)×${sd1}² + (${n2}-1)×${sd2}²) / (${n1}+${n2}-2)]\n` +
      `Pooled SD = √[(${n1 - 1}×${fmt(sd1 ** 2)} + ${n2 - 1}×${fmt(sd2 ** 2)}) / ${n1 + n2 - 2}]\n` +
      `Pooled SD = √[${((n1 - 1) * sd1 ** 2 + (n2 - 1) * sd2 ** 2).toFixed(4)} / ${n1 + n2 - 2}]\n` +
      `Pooled SD = ${pooledSD.toFixed(4)}`,
  );
  addToHistory(result);
}

// Change Score SD calculation
function calculateChangeSD() {
  const sdPre = readNumber("change-sd-pre");
  const sdPost = readNumber("change-sd-post");
  const r = readNumber("change-r");
  const resultDiv = document.getElementById("change-sd-result");

  if (!allFinite(sdPre, sdPost, r) || sdPre < 0 || sdPost < 0 || r < -1 || r > 1) {
    showError(resultDiv, "請輸入有效的標準差和相關係數 (-1 ≤ r ≤ 1)");
    return;
  }

  // Algebraically non-negative; clamp float round-off (e.g. r = 1, equal SDs).
  const changeVariance = Math.max(0, sdPre ** 2 + sdPost ** 2 - 2 * r * sdPre * sdPost);
  const changeSD = Math.sqrt(changeVariance);

  const result = {
    calculation: "Change Score SD",
    inputs: { SDpre: sdPre, SDpost: sdPost, correlation: r },
    outputs: { changeSD: changeSD },
    formula: "SD_change = √(SD_pre² + SD_post² - 2×r×SD_pre×SD_post)",
    reference: "Standard change score variance formula",
  };

  displayResult(
    resultDiv,
    `Change SD = ${changeSD.toFixed(4)}\n\n計算步驟：\n` +
      `SD_change = √(${fmt(sdPre)}² + ${fmt(sdPost)}² - 2×${fmt(r)}×${fmt(sdPre)}×${fmt(sdPost)})\n` +
      `SD_change = √(${fmt(sdPre ** 2)} + ${fmt(sdPost ** 2)} - ${fmt(2 * r * sdPre * sdPost)})\n` +
      `SD_change = √${changeVariance.toFixed(4)}\n` +
      `SD_change = ${changeSD.toFixed(4)}`,
  );
  addToHistory(result);
}
