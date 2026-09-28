// Module C: CI/SE Conversion
function calculateESConversion() {
  const esType = document.getElementById("es-type").value;
  const esValue = readNumber("es-value");
  const ciLower = readNumber("es-ci-lower");
  const ciUpper = readNumber("es-ci-upper");
  const se = readNumber("es-se");
  const ciLevel = parseInt(document.getElementById("es-ci-level").value);
  const resultDiv = document.getElementById("es-conversion-result");

  const criticalValue = getCriticalValueZ(ciLevel);
  let calculatedES, calculatedSE, calculatedCILower, calculatedCIUpper;
  let calculations = "";

  const supplied = (id) => document.getElementById(id).value.trim() !== "";
  const hasES = supplied("es-value");
  const hasLower = supplied("es-ci-lower");
  const hasUpper = supplied("es-ci-upper");
  const hasSE = supplied("es-se");
  if ((hasES && !Number.isFinite(esValue)) ||
      (hasSE && (!Number.isFinite(se) || se <= 0)) ||
      (hasLower && !Number.isFinite(ciLower)) ||
      (hasUpper && !Number.isFinite(ciUpper))) {
    showError(resultDiv, "請輸入有限數值，標準誤必須大於 0");
    return;
  }
  if (hasLower !== hasUpper || (hasLower && ciLower >= ciUpper)) {
    showError(resultDiv, "請提供完整信賴區間，且下界必須小於上界");
    return;
  }

  if (hasLower && hasUpper) {
    const midpoint = (ciLower + ciUpper) / 2;
    calculatedSE = (ciUpper - ciLower) / (2 * criticalValue);
    // Preserve the intended consistency check before the CI-only path.
    if (hasES && Math.abs(esValue - midpoint) > 0.001) {
      showError(resultDiv, "效果量與信賴區間中點不一致；請確認尺度與輸入資料");
      return;
    }
    if (hasSE && Math.abs(se - calculatedSE) > 0.001) {
      showError(resultDiv, "標準誤與信賴區間不一致；請確認輸入資料");
      return;
    }
    calculatedES = hasES ? esValue : midpoint;
    calculatedCILower = ciLower;
    calculatedCIUpper = ciUpper;
    calculations += `從信賴區間計算：\n`;
    calculations += hasES
      ? `使用輸入效果量 = ${calculatedES.toFixed(4)}（已核對 CI 中點）\n`
      : `Effect Size = (${ciUpper} + ${ciLower}) / 2 = ${calculatedES.toFixed(4)}\n`;
    calculations += `SE = (${ciUpper} - ${ciLower}) / (2 × ${criticalValue.toFixed(4)}) = ${calculatedSE.toFixed(4)}\n\n`;
  } else if (hasES && hasSE) {
    calculatedES = esValue;
    calculatedSE = se;
    calculatedCILower = esValue - criticalValue * se;
    calculatedCIUpper = esValue + criticalValue * se;
    calculations += `從效果量和標準誤計算：\n`;
    calculations += `${ciLevel}% CI = ${esValue.toFixed(4)} ± ${criticalValue.toFixed(4)} × ${se.toFixed(4)}\n`;
    calculations += `CI = [${calculatedCILower.toFixed(4)}, ${calculatedCIUpper.toFixed(4)}]\n\n`;
  } else {
    showError(resultDiv, "請提供效果量與標準誤，或完整的信賴區間");
    return;
  }
  if (!allFinite(calculatedES, calculatedSE, calculatedCILower, calculatedCIUpper) || calculatedSE <= 0) {
    showError(resultDiv, "數值超出可計算範圍，請檢查輸入資料");
    return;
  }

  // If we don't have CI bounds, calculate them
  if (isNaN(calculatedCILower) || isNaN(calculatedCIUpper)) {
    calculatedCILower = calculatedES - criticalValue * calculatedSE;
    calculatedCIUpper = calculatedES + criticalValue * calculatedSE;
  }

  // Calculate additional statistics
  const zValue = calculatedES / calculatedSE;
  const pValue = 2 * (1 - normalCDF(Math.abs(zValue)));

  const result = {
    calculation: `Effect Size Conversion (${esType})`,
    inputs: { esType, esValue, ciLower, ciUpper, se, ciLevel },
    outputs: {
      effectSize: calculatedES,
      SE: calculatedSE,
      CI_lower: calculatedCILower,
      CI_upper: calculatedCIUpper,
      Z: zValue,
      p: pValue,
      criticalValue: criticalValue,
    },
    formula: "SE = (Upper CI - Lower CI) / (2 × critical value)",
    reference: "Standard confidence interval relationships",
  };

  displayResult(
    resultDiv,
    `效果量類型：${esType.toUpperCase()}\n` +
      `Effect Size = ${calculatedES.toFixed(4)}\n` +
      `Standard Error = ${calculatedSE.toFixed(4)}\n` +
      `${ciLevel}% CI = [${calculatedCILower.toFixed(4)}, ${calculatedCIUpper.toFixed(4)}]\n` +
      `Z = ${zValue.toFixed(4)}\n` +
      `p-value = ${pValue.toFixed(6)}\n\n` +
      calculations +
      `Critical value (${ciLevel}%) = ${criticalValue.toFixed(4)}`,
  );
  addToHistory(result);
}
