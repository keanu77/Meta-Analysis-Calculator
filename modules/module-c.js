// Module C: CI/SE Conversion
function calculateESConversion() {
  const esType = document.getElementById("es-type").value;
  const esValue = parseFloat(document.getElementById("es-value").value);
  const ciLower = parseFloat(document.getElementById("es-ci-lower").value);
  const ciUpper = parseFloat(document.getElementById("es-ci-upper").value);
  const se = parseFloat(document.getElementById("es-se").value);
  const ciLevel = parseInt(document.getElementById("es-ci-level").value);
  const resultDiv = document.getElementById("es-conversion-result");

  const criticalValue = getCriticalValueZ(ciLevel);
  let calculatedES, calculatedSE, calculatedCILower, calculatedCIUpper;
  let calculations = "";

  // Determine what we can calculate based on available inputs
  if (!isNaN(ciLower) && !isNaN(ciUpper)) {
    // Calculate ES and SE from CI
    calculatedES = (ciLower + ciUpper) / 2;
    calculatedSE = (ciUpper - ciLower) / (2 * criticalValue);
    calculations += `從信賴區間計算：\n`;
    calculations += `Effect Size = (${ciUpper} + ${ciLower}) / 2 = ${calculatedES.toFixed(4)}\n`;
    calculations += `SE = (${ciUpper} - ${ciLower}) / (2 × ${criticalValue.toFixed(4)}) = ${calculatedSE.toFixed(4)}\n\n`;
  } else if (!isNaN(esValue) && !isNaN(se)) {
    // Calculate CI from ES and SE
    calculatedES = esValue;
    calculatedSE = se;
    calculatedCILower = esValue - criticalValue * se;
    calculatedCIUpper = esValue + criticalValue * se;
    calculations += `從效果量和標準誤計算：\n`;
    calculations += `${ciLevel}% CI = ${esValue.toFixed(4)} ± ${criticalValue.toFixed(4)} × ${se.toFixed(4)}\n`;
    calculations += `CI = [${calculatedCILower.toFixed(4)}, ${calculatedCIUpper.toFixed(4)}]\n\n`;
  } else if (!isNaN(esValue) && !isNaN(ciLower) && !isNaN(ciUpper)) {
    // Validate consistency and calculate SE
    const midpoint = (ciLower + ciUpper) / 2;
    if (Math.abs(esValue - midpoint) > 0.001) {
      showError(resultDiv, "效果量與信賴區間中點不一致");
      return;
    }
    calculatedES = esValue;
    calculatedSE = (ciUpper - ciLower) / (2 * criticalValue);
    calculatedCILower = ciLower;
    calculatedCIUpper = ciUpper;
    calculations += `驗證一致性並計算標準誤：\n`;
    calculations += `SE = (${ciUpper} - ${ciLower}) / (2 × ${criticalValue.toFixed(4)}) = ${calculatedSE.toFixed(4)}\n\n`;
  } else {
    showError(resultDiv, "請提供足夠的輸入數據進行轉換");
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
