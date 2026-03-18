// Module A: Within-group & Descriptive Statistics Conversion
function calculateSEtoSD() {
  const se = parseFloat(document.getElementById("se-input").value);
  const n = parseInt(document.getElementById("se-n-input").value);
  const resultDiv = document.getElementById("se-sd-result");

  if (isNaN(se) || isNaN(n) || n <= 0) {
    showError(resultDiv, "請輸入有效的 SE 值和樣本數 (n > 0)");
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
    `SD = ${sd.toFixed(4)}\n\n計算步驟：\nSD = ${se} × √${n}\nSD = ${se} × ${Math.sqrt(n).toFixed(4)}\nSD = ${sd.toFixed(4)}`,
  );
  addToHistory(result);
}

// CI to Mean & SD conversion
function calculateCItoMeanSD() {
  const lowerCI = parseFloat(document.getElementById("ci-lower").value);
  const upperCI = parseFloat(document.getElementById("ci-upper").value);
  const ciLevel = parseInt(document.getElementById("ci-level").value);
  const n = parseInt(document.getElementById("ci-n").value);
  const distribution = document.getElementById("ci-distribution").value;
  const resultDiv = document.getElementById("ci-mean-sd-result");

  if (
    isNaN(lowerCI) ||
    isNaN(upperCI) ||
    isNaN(n) ||
    n <= 0 ||
    lowerCI >= upperCI
  ) {
    showError(resultDiv, "請輸入有效的信賴區間界限和樣本數");
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
      `SD = ${se.toFixed(4)} × √${n} = ${sd.toFixed(4)}`,
  );
  addToHistory(result);
}

// Quantiles to Mean & SD conversion
function calculateQuantilesToMeanSD() {
  const method = document.getElementById("quantile-method").value;
  const min = parseFloat(document.getElementById("q-min").value);
  const q1 = parseFloat(document.getElementById("q-q1").value);
  const median = parseFloat(document.getElementById("q-median").value);
  const q3 = parseFloat(document.getElementById("q-q3").value);
  const max = parseFloat(document.getElementById("q-max").value);
  const n = parseInt(document.getElementById("q-n").value);
  const resultDiv = document.getElementById("quantiles-result");

  if (isNaN(median) || isNaN(n) || n <= 0) {
    showError(resultDiv, "請至少輸入中位數和樣本數");
    return;
  }

  let mean, sd;
  let calculationSteps = "";
  let reference = "";

  switch (method) {
    case "luo":
      ({ mean, sd, calculationSteps, reference } = calculateLuoMethod(
        min,
        q1,
        median,
        q3,
        max,
        n,
      ));
      break;
    case "wan":
      ({ mean, sd, calculationSteps, reference } = calculateWanMethod(
        min,
        q1,
        median,
        q3,
        max,
        n,
      ));
      break;
    case "hozo":
      ({ mean, sd, calculationSteps, reference } = calculateHozoMethod(
        min,
        median,
        max,
        n,
      ));
      break;
    case "shi":
      ({ mean, sd, calculationSteps, reference } = calculateShiMethod(
        min,
        q1,
        median,
        q3,
        max,
        n,
      ));
      break;
    default:
      showError(resultDiv, "未知的計算方法");
      return;
  }

  if (isNaN(mean) || isNaN(sd)) {
    showError(resultDiv, "計算失敗，請檢查輸入數據");
    return;
  }

  const result = {
    calculation: `Quantiles to Mean & SD (${method.toUpperCase()})`,
    inputs: { min, q1, median, q3, max, n, method },
    outputs: { mean, SD: sd },
    formula: calculationSteps,
    reference: reference,
  };

  displayResult(
    resultDiv,
    `Mean = ${mean.toFixed(4)}\nSD = ${sd.toFixed(4)}\n\n計算方法：${method.toUpperCase()}\n${calculationSteps}\n\n參考文獻：${reference}`,
  );
  addToHistory(result);
}

// Dedicated Hozo method calculator function
function calculateHozoOnly() {
  const min = parseFloat(document.getElementById("hozo-min").value);
  const median = parseFloat(document.getElementById("hozo-median").value);
  const max = parseFloat(document.getElementById("hozo-max").value);
  const n = parseInt(document.getElementById("hozo-n").value);
  const resultDiv = document.getElementById("hozo-only-result");

  if (isNaN(min) || isNaN(median) || isNaN(max) || isNaN(n) || n <= 0) {
    showError(resultDiv, "請輸入所有必要參數：最小值、中位數、最大值和樣本數");
    return;
  }

  if (min >= median || median >= max) {
    showError(resultDiv, "請確保 最小值 < 中位數 < 最大值");
    return;
  }

  try {
    const { mean, sd, calculationSteps, reference } = calculateHozoMethod(
      min,
      median,
      max,
      n,
    );

    const result = {
      calculation: "Median & Range to Mean & SD (Hozo 2005)",
      inputs: { min, median, max, n },
      outputs: { mean, SD: sd },
      formula: calculationSteps,
      reference: reference,
    };

    displayResult(
      resultDiv,
      `平均數 (Mean) = ${mean.toFixed(4)}\n標準差 (SD) = ${sd.toFixed(4)}\n\n${calculationSteps}\n\n參考文獻：${reference}`,
    );
    addToHistory(result);
  } catch (error) {
    showError(resultDiv, error.message);
  }
}

// Luo et al. (2018) method
function calculateLuoMethod(min, q1, median, q3, max, n) {
  let mean, sd;
  let calculationSteps = "";
  const reference = "Luo et al. (2018) Statistical Methods in Medical Research";

  // Check available data and use appropriate formula
  if (
    !isNaN(min) &&
    !isNaN(q1) &&
    !isNaN(median) &&
    !isNaN(q3) &&
    !isNaN(max)
  ) {
    // Full five-number summary available
    mean = (min + 2 * q1 + 2 * median + 2 * q3 + max) / 8;

    const a = (n - 1) / (n + 1);
    const b = (n - 1) / (n * (n + 1));

    sd = Math.sqrt(
      (a * ((max - min) ** 2 + 2 * (q3 - q1) ** 2)) / 16 +
        (b * ((max - min) ** 2 - 2 * (q3 - q1) ** 2)) / 16,
    );

    calculationSteps =
      `使用完整五數摘要 (min, Q1, median, Q3, max)\n` +
      `Mean = (min + 2×Q1 + 2×median + 2×Q3 + max) / 8\n` +
      `Mean = (${min} + 2×${q1} + 2×${median} + 2×${q3} + ${max}) / 8 = ${mean.toFixed(4)}\n\n` +
      `SD 計算使用 Luo 優化公式，考慮樣本大小修正`;
  } else if (!isNaN(min) && !isNaN(median) && !isNaN(max)) {
    // Only min, median, max available
    mean = (min + 2 * median + max) / 4;

    const c = (n - 1) / (n + 1);
    sd = (Math.sqrt(c) * (max - min)) / 4;

    calculationSteps =
      `使用三點估計 (min, median, max)\n` +
      `Mean = (min + 2×median + max) / 4\n` +
      `Mean = (${min} + 2×${median} + ${max}) / 4 = ${mean.toFixed(4)}\n\n` +
      `SD = √((n-1)/(n+1)) × (max - min) / 4\n` +
      `SD = √(${n - 1}/${n + 1}) × (${max} - ${min}) / 4 = ${sd.toFixed(4)}`;
  } else {
    throw new Error("Insufficient data for Luo method");
  }

  return { mean, sd, calculationSteps, reference };
}

// Wan et al. (2014) method
function calculateWanMethod(min, q1, median, q3, max, n) {
  let mean, sd;
  let calculationSteps = "";
  const reference = "Wan et al. (2014) BMC Medical Research Methodology";

  if (
    !isNaN(min) &&
    !isNaN(q1) &&
    !isNaN(median) &&
    !isNaN(q3) &&
    !isNaN(max)
  ) {
    // Full five-number summary
    mean = (q1 + median + q3) / 3;

    sd =
      (max - min) / (2 * getQuantileNormal(0.75, n)) +
      (q3 - q1) / (2 * getQuantileNormal(0.75, n));

    calculationSteps =
      `使用五數摘要的 Wan 方法\n` +
      `Mean = (Q1 + median + Q3) / 3\n` +
      `Mean = (${q1} + ${median} + ${q3}) / 3 = ${mean.toFixed(4)}\n\n` +
      `SD 計算結合範圍和四分位距信息`;
  } else if (!isNaN(min) && !isNaN(median) && !isNaN(max)) {
    // Only three points
    mean = (min + median + max) / 3;
    sd = (max - min) / (2 * getQuantileNormal(0.75, n));

    calculationSteps =
      `使用三點的 Wan 方法\n` +
      `Mean = (min + median + max) / 3\n` +
      `Mean = (${min} + ${median} + ${max}) / 3 = ${mean.toFixed(4)}\n\n` +
      `SD = (max - min) / (2 × Φ⁻¹(0.75)) ≈ (max - min) / 2.67`;
  } else {
    throw new Error("Insufficient data for Wan method");
  }

  return { mean, sd, calculationSteps, reference };
}

// Hozo et al. (2005) method - Enhanced with accurate formulas from the paper
function calculateHozoMethod(min, median, max, n) {
  if (isNaN(min) || isNaN(median) || isNaN(max)) {
    throw new Error("Hozo method requires min, median, and max");
  }

  // Mean estimation using Hozo formula (5)
  let mean;
  if (n > 25) {
    // For large samples, median approximates mean well
    mean = median;
  } else {
    // For small samples, use the corrected formula
    mean = (min + 2 * median + max) / 4;
  }

  // SD estimation using Hozo formulas based on sample size
  let sd;
  let sdFormula;

  if (n <= 15) {
    // Formula (16) for very small samples
    sd = Math.sqrt(
      (1 / 12) *
        (Math.pow(min - 2 * median + max, 2) / 4 + Math.pow(max - min, 2)),
    );
    sdFormula = "Formula (16): √[(a-2m+b)²/48 + (b-a)²/12]";
  } else if (n <= 70) {
    // Range/4 for moderate samples
    sd = (max - min) / 4;
    sdFormula = "Range/4 formula";
  } else {
    // Range/6 for large samples
    sd = (max - min) / 6;
    sdFormula = "Range/6 formula";
  }

  const calculationSteps =
    `Hozo et al. (2005) 方法 (n=${n})\n\n` +
    `平均數估計：\n` +
    (n > 25
      ? `n > 25，使用中位數作為平均數估計\nMean ≈ median = ${median}`
      : `n ≤ 25，使用修正公式\nMean = (a + 2m + b) / 4\nMean = (${min} + 2×${median} + ${max}) / 4 = ${mean.toFixed(4)}`) +
    `\n\n` +
    `標準差估計：\n` +
    `使用 ${sdFormula}\n` +
    (n <= 15
      ? `SD = √[(${min}-2×${median}+${max})²/48 + (${max}-${min})²/12]\n` +
        `SD = √[${Math.pow(min - 2 * median + max, 2).toFixed(2)}/48 + ${Math.pow(max - min, 2).toFixed(2)}/12] = ${sd.toFixed(4)}`
      : `SD = (${max} - ${min}) / ${n <= 70 ? "4" : "6"} = ${sd.toFixed(4)}`);

  const reference =
    "Hozo et al. (2005) Estimating the mean and variance from the median, range, and the size of a sample. BMC Medical Research Methodology, 5:13";

  return { mean, sd, calculationSteps, reference };
}

// Shi et al. (2020) method
function calculateShiMethod(min, q1, median, q3, max, n) {
  if (isNaN(min) || isNaN(median) || isNaN(max)) {
    throw new Error("Shi method requires at least min, median, and max");
  }

  let mean, sd;
  let calculationSteps = "";
  const reference = "Shi et al. (2020) Research Synthesis Methods";

  if (!isNaN(q1) && !isNaN(q3)) {
    // Use optimized five-number summary method
    mean = (min + q1 + median + q3 + max) / 5;

    // Shi's optimized SD estimation
    const alpha = (n + 1) / (n - 1);
    const beta = n / (n - 1);

    sd = Math.sqrt(
      (alpha * ((max - min) ** 2 + (q3 - q1) ** 2)) / 16 +
        beta * (median - (min + max) / 2) ** 2,
    );

    calculationSteps =
      `Shi 優化方法使用五數摘要\n` +
      `Mean = (min + Q1 + median + Q3 + max) / 5\n` +
      `Mean = (${min} + ${q1} + ${median} + ${q3} + ${max}) / 5 = ${mean.toFixed(4)}\n\n` +
      `SD 使用 Shi 優化公式，考慮所有分位數信息`;
  } else {
    // Fall back to three-point method
    mean = (min + median + max) / 3;
    sd = (max - min) / (2 * Math.sqrt(3));

    calculationSteps =
      `Shi 三點方法\n` +
      `Mean = (min + median + max) / 3\n` +
      `Mean = (${min} + ${median} + ${max}) / 3 = ${mean.toFixed(4)}\n\n` +
      `SD = (max - min) / (2√3) = ${sd.toFixed(4)}`;
  }

  return { mean, sd, calculationSteps, reference };
}

// Pooled SD calculation
function calculatePooledSD() {
  const sd1 = parseFloat(document.getElementById("pooled-sd1").value);
  const n1 = parseInt(document.getElementById("pooled-n1").value);
  const sd2 = parseFloat(document.getElementById("pooled-sd2").value);
  const n2 = parseInt(document.getElementById("pooled-n2").value);
  const resultDiv = document.getElementById("pooled-sd-result");

  if (
    isNaN(sd1) ||
    isNaN(n1) ||
    isNaN(sd2) ||
    isNaN(n2) ||
    n1 <= 0 ||
    n2 <= 0
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
      `Pooled SD = √[(${n1 - 1}×${sd1 ** 2} + ${n2 - 1}×${sd2 ** 2}) / ${n1 + n2 - 2}]\n` +
      `Pooled SD = √[${((n1 - 1) * sd1 ** 2 + (n2 - 1) * sd2 ** 2).toFixed(4)} / ${n1 + n2 - 2}]\n` +
      `Pooled SD = ${pooledSD.toFixed(4)}`,
  );
  addToHistory(result);
}

// Change Score SD calculation
function calculateChangeSD() {
  const sdPre = parseFloat(document.getElementById("change-sd-pre").value);
  const sdPost = parseFloat(document.getElementById("change-sd-post").value);
  const r = parseFloat(document.getElementById("change-r").value);
  const resultDiv = document.getElementById("change-sd-result");

  if (isNaN(sdPre) || isNaN(sdPost) || isNaN(r) || r < -1 || r > 1) {
    showError(resultDiv, "請輸入有效的標準差和相關係數 (-1 ≤ r ≤ 1)");
    return;
  }

  const changeSD = Math.sqrt(sdPre ** 2 + sdPost ** 2 - 2 * r * sdPre * sdPost);

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
      `SD_change = √(${sdPre}² + ${sdPost}² - 2×${r}×${sdPre}×${sdPost})\n` +
      `SD_change = √(${sdPre ** 2} + ${sdPost ** 2} - ${2 * r * sdPre * sdPost})\n` +
      `SD_change = √${(sdPre ** 2 + sdPost ** 2 - 2 * r * sdPre * sdPost).toFixed(4)}\n` +
      `SD_change = ${changeSD.toFixed(4)}`,
  );
  addToHistory(result);
}
