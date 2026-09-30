// Module C: CI/SE Conversion
// Ratio measures entered on their natural scale are analysed as ln(ratio);
// "log-*" types expect values that are already on the natural-log scale.
const RATIO_TYPES = { or: "OR", rr: "RR", hr: "HR" };
const ES_TYPE_LABELS = {
  mean: "Mean/MD", smd: "SMD", or: "OR", rr: "RR", hr: "HR",
  "log-or": "ln(OR)", "log-rr": "ln(RR)", "log-hr": "ln(HR)",
};
// Supplied values may differ from the CI through rounding; beyond these
// tolerances the difference is reported instead of silently accepted.
const MIDPOINT_TOLERANCE = 0.1; // fraction of the CI half-width
const SE_TOLERANCE = 0.1; // relative difference

function readESInputs() {
  const supplied = (id) => document.getElementById(id).value.trim() !== "";
  const read = (id) => (supplied(id) ? readNumber(id) : undefined);
  return { es: read("es-value"), lower: read("es-ci-lower"), upper: read("es-ci-upper"), se: read("es-se") };
}

// Validate and move ratio inputs to the log scale; returns { values } or { error }.
function toAnalysisScale(esType, raw) {
  const given = [raw.es, raw.lower, raw.upper, raw.se].filter((value) => value !== undefined);
  if (!allFinite(...given)) return { error: "請輸入有限數值" };
  if (raw.se !== undefined && raw.se <= 0) return { error: "標準誤必須大於 0" };
  if ((raw.lower === undefined) !== (raw.upper === undefined)) {
    return { error: "請提供完整信賴區間（上下界都要填）" };
  }
  if (!RATIO_TYPES[esType]) return { values: raw };
  if ([raw.es, raw.lower, raw.upper].some((value) => value !== undefined && value <= 0)) {
    return { error: `${RATIO_TYPES[esType]} 與其信賴區間必須大於 0（請輸入原始比值，不是 log 值）` };
  }
  const ln = (value) => (value === undefined ? undefined : Math.log(value));
  return { values: { es: ln(raw.es), lower: ln(raw.lower), upper: ln(raw.upper), se: raw.se } };
}

// Combine the supplied values into one estimate; returns { result } or { error }.
function resolveEffect(v, criticalValue) {
  const notes = [];
  if (v.lower !== undefined) {
    if (v.lower >= v.upper) return { error: "信賴區間下界必須小於上界" };
    const midpoint = (v.lower + v.upper) / 2;
    const halfWidth = (v.upper - v.lower) / 2;
    const seFromCI = halfWidth / criticalValue;
    if (v.es !== undefined) {
      if (v.es < v.lower || v.es > v.upper) {
        return { error: "效果量不在信賴區間內；請確認尺度與輸入資料" };
      }
      if (Math.abs(v.es - midpoint) > MIDPOINT_TOLERANCE * halfWidth) {
        notes.push("效果量偏離 CI 中點超過半寬的 10%：CI 可能不對稱或非此尺度的 Wald 區間，請核對原文。");
      }
    }
    if (v.se !== undefined && Math.abs(v.se - seFromCI) / seFromCI > SE_TOLERANCE) {
      notes.push(`輸入的 SE (${fmt(v.se)}) 與 CI 推得的 SE (${seFromCI.toFixed(4)}) 不一致，以下使用由 CI 推得的 SE。`);
    }
    return {
      result: {
        es: v.es !== undefined ? v.es : midpoint,
        se: seFromCI,
        lower: v.lower,
        upper: v.upper,
        source: v.es !== undefined ? "ci+es" : "ci",
        notes,
      },
    };
  }
  if (v.es !== undefined && v.se !== undefined) {
    return {
      result: {
        es: v.es,
        se: v.se,
        lower: v.es - criticalValue * v.se,
        upper: v.es + criticalValue * v.se,
        source: "es+se",
        notes,
      },
    };
  }
  return { error: "請提供效果量與標準誤，或完整的信賴區間" };
}

function describeESSteps(esType, r, criticalValue, ciLevel) {
  const isRatio = Boolean(RATIO_TYPES[esType]);
  const scale = isRatio ? `ln(${RATIO_TYPES[esType]})` : "效果量";
  const lines = [isRatio ? `比值先取自然對數，在 ${scale} 尺度計算：` : "計算步驟："];
  if (r.source === "es+se") {
    lines.push(`${ciLevel}% CI = ${r.es.toFixed(4)} ± ${criticalValue.toFixed(4)} × ${r.se.toFixed(4)}`);
  } else {
    if (r.source === "ci") lines.push(`${scale} = (上界 + 下界)/2 = ${r.es.toFixed(4)}`);
    lines.push(`SE = (上界 − 下界)/(2 × ${criticalValue.toFixed(4)}) = ${r.se.toFixed(4)}`);
  }
  if (esType === "mean") {
    lines.push("", "若原文的 CI 以 t 分布建構（小樣本），由 CI 推得的 SE 會略為高估。");
  }
  return lines.join("\n");
}

function calculateESConversion() {
  const esType = document.getElementById("es-type").value;
  const ciLevel = parseInt(document.getElementById("es-ci-level").value, 10);
  const resultDiv = document.getElementById("es-conversion-result");

  if (!ES_TYPE_LABELS[esType]) {
    showError(resultDiv, "未知的效果量類型");
    return;
  }
  const criticalValue = getCriticalValueZ(ciLevel);
  if (!Number.isFinite(criticalValue)) {
    showError(resultDiv, "未知的信賴水準");
    return;
  }
  const scaled = toAnalysisScale(esType, readESInputs());
  if (scaled.error) {
    showError(resultDiv, scaled.error);
    return;
  }
  const resolved = resolveEffect(scaled.values, criticalValue);
  if (resolved.error) {
    showError(resultDiv, resolved.error);
    return;
  }
  const r = resolved.result;
  if (!allFinite(r.es, r.se, r.lower, r.upper) || !(r.se > 0)) {
    showError(resultDiv, "數值超出可計算範圍，請檢查輸入資料");
    return;
  }

  const zValue = r.es / r.se;
  const pValue = twoSidedPFromZ(zValue);
  const ratioName = RATIO_TYPES[esType];
  const ratio = ratioName
    ? { ratio: Math.exp(r.es), ratio_CI_lower: Math.exp(r.lower), ratio_CI_upper: Math.exp(r.upper) }
    : {};

  addToHistory({
    calculation: `Effect Size Conversion (${esType})`,
    inputs: { esType, ciLevel },
    outputs: {
      effectSize: r.es, SE: r.se, CI_lower: r.lower, CI_upper: r.upper,
      Z: zValue, p: pValue, criticalValue, ...ratio,
    },
    formula: "SE = (Upper CI − Lower CI) / (2 × critical value)",
    reference: "Cochrane Handbook §6.3.1–6.3.2",
  });

  const scaleLabel = ratioName ? `ln(${ratioName})` : ES_TYPE_LABELS[esType];
  const header = ratioName
    ? `${ratioName} = ${ratio.ratio.toFixed(4)}，${ciLevel}% CI = [${ratio.ratio_CI_lower.toFixed(4)}, ${ratio.ratio_CI_upper.toFixed(4)}]\n\n`
    : "";
  displayResult(
    resultDiv,
    header +
      `${scaleLabel} = ${r.es.toFixed(4)}\n` +
      `SE(${scaleLabel}) = ${r.se.toFixed(4)}\n` +
      `${ciLevel}% CI = [${r.lower.toFixed(4)}, ${r.upper.toFixed(4)}]\n` +
      `Z = ${zValue.toFixed(4)}\n` +
      `p-value = ${formatP(pValue)}\n\n` +
      (r.notes.length ? `⚠ ${r.notes.join("\n⚠ ")}\n\n` : "") +
      describeESSteps(esType, r, criticalValue, ciLevel) +
      `\n\n統合分析軟體（RevMan 的 generic inverse variance 等）請輸入 ${scaleLabel} 與其 SE。`,
  );
}
