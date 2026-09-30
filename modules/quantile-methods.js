// Estimating the sample mean and SD from median-based summaries.
// Scenarios follow Wan et al. (2014):
//   S1 = {min, median, max}, S2 = {Q1, median, Q3}, S3 = {min, Q1, median, Q3, max}.
// Formulas cross-checked against the R package meta (mean_sd_range, mean_sd_iqr,
// mean_sd_iqr_range). All methods assume approximately normal data.

// ξ(n) = expected range of n standard normal values, n = 1..50 (Wan 2014, Table 1).
const WAN_RANGE_TABLE = [
  0.000, 1.128, 1.693, 2.059, 2.326, 2.534, 2.704, 2.847, 2.970, 3.078,
  3.173, 3.259, 3.336, 3.407, 3.472, 3.532, 3.588, 3.640, 3.689, 3.735,
  3.778, 3.819, 3.858, 3.895, 3.931, 3.964, 3.997, 4.027, 4.057, 4.086,
  4.113, 4.139, 4.165, 4.189, 4.213, 4.236, 4.259, 4.280, 4.301, 4.322,
  4.341, 4.361, 4.379, 4.398, 4.415, 4.433, 4.450, 4.466, 4.482, 4.498,
];
// η(n) = expected IQR of n standard normal values, n = 4Q+1 for Q = 1..50 (Wan 2014, Table 2).
const WAN_IQR_TABLE = [
  0.990, 1.144, 1.206, 1.239, 1.260, 1.274, 1.284, 1.292, 1.298, 1.303,
  1.307, 1.311, 1.313, 1.316, 1.318, 1.320, 1.322, 1.323, 1.324, 1.326,
  1.327, 1.328, 1.329, 1.330, 1.330, 1.331, 1.332, 1.332, 1.333, 1.333,
  1.334, 1.334, 1.335, 1.335, 1.336, 1.336, 1.336, 1.337, 1.337, 1.337,
  1.338, 1.338, 1.338, 1.338, 1.339, 1.339, 1.339, 1.339, 1.339, 1.340,
];

const QUANTILE_REFERENCES = {
  luo: "Luo D, et al. Stat Methods Med Res 2018;27(6):1785-1805",
  wan: "Wan X, et al. BMC Med Res Methodol 2014;14:135",
  shi: "Shi J, et al. Res Synth Methods 2020;11(5):641-654",
  hozo: "Hozo SP, et al. BMC Med Res Methodol 2005;5:13",
};

// Which Wan scenario the supplied values form; null when a pair is incomplete.
function quantileScenario({ min, q1, q3, max }) {
  const hasRange = Number.isFinite(min) && Number.isFinite(max);
  const hasIqr = Number.isFinite(q1) && Number.isFinite(q3);
  if (Number.isFinite(min) !== Number.isFinite(max)) return null;
  if (Number.isFinite(q1) !== Number.isFinite(q3)) return null;
  if (hasRange && hasIqr) return "S3";
  if (hasRange) return "S1";
  if (hasIqr) return "S2";
  return null;
}

// ξ(n): exact table for n ≤ 50, Blom approximation 2Φ⁻¹((n−0.375)/(n+0.25)) above.
function wanRangeDivisor(n) {
  return n > 50 ? 2 * qnorm((n - 0.375) / (n + 0.25)) : WAN_RANGE_TABLE[n - 1];
}

// η(n): exact table for n ≤ 201, 2Φ⁻¹((0.75n−0.125)/(n+0.25)) above.
function wanIqrDivisor(n) {
  return n > 201
    ? 2 * qnorm((0.75 * n - 0.125) / (n + 0.25))
    : WAN_IQR_TABLE[Math.ceil(0.25 * (n - 1)) - 1];
}

function luoMean(scenario, v, n) {
  const { min, q1, median, q3, max } = v;
  if (scenario === "S1") {
    const w = 4 / (4 + n ** 0.75);
    return {
      mean: w * ((min + max) / 2) + (1 - w) * median,
      text: `Luo S1：w = 4/(4 + n^0.75) = ${w.toFixed(4)}\nMean = w×(min+max)/2 + (1−w)×median`,
    };
  }
  if (scenario === "S2") {
    const w = 0.7 + 0.39 / n;
    return {
      mean: w * ((q1 + q3) / 2) + (1 - w) * median,
      text: `Luo S2：w = 0.7 + 0.39/n = ${w.toFixed(4)}\nMean = w×(Q1+Q3)/2 + (1−w)×median`,
    };
  }
  const w1 = 2.2 / (2.2 + n ** 0.75);
  const w2 = 0.7 - 0.72 / n ** 0.55;
  return {
    mean: w1 * ((min + max) / 2) + w2 * ((q1 + q3) / 2) + (1 - w1 - w2) * median,
    text:
      `Luo S3：w₁ = 2.2/(2.2 + n^0.75) = ${w1.toFixed(4)}，w₂ = 0.7 − 0.72/n^0.55 = ${w2.toFixed(4)}\n` +
      `Mean = w₁×(min+max)/2 + w₂×(Q1+Q3)/2 + (1−w₁−w₂)×median`,
  };
}

function wanMean(scenario, v, n) {
  const { min, q1, median, q3, max } = v;
  if (scenario === "S1") {
    return {
      mean: (min + 2 * median + max) / 4 + (min - 2 * median + max) / (4 * n),
      text: "Wan S1：Mean = (min + 2×median + max)/4 + (min − 2×median + max)/(4n)",
    };
  }
  if (scenario === "S2") {
    return { mean: (q1 + median + q3) / 3, text: "Wan S2：Mean = (Q1 + median + Q3)/3" };
  }
  return {
    mean: (min + 2 * q1 + 2 * median + 2 * q3 + max) / 8,
    text: "Wan S3：Mean = (min + 2×Q1 + 2×median + 2×Q3 + max)/8",
  };
}

// SD: Wan 2014 for S1/S2 (both methods); S3 uses Shi 2020 with Luo, Wan 2014 with Wan.
function quantileSD(method, scenario, v, n) {
  const { min, q1, q3, max } = v;
  const range = max - min;
  const iqr = q3 - q1;
  if (scenario === "S1") {
    const xi = wanRangeDivisor(n);
    return { sd: range / xi, text: `Wan S1：SD = (max − min)/ξ(n)，ξ(${n}) = ${xi.toFixed(4)}`, ref: "wan" };
  }
  if (scenario === "S2") {
    const eta = wanIqrDivisor(n);
    return { sd: iqr / eta, text: `Wan S2：SD = (Q3 − Q1)/η(n)，η(${n}) = ${eta.toFixed(4)}`, ref: "wan" };
  }
  if (method === "wan") {
    const xi = wanRangeDivisor(n);
    const eta = wanIqrDivisor(n);
    return {
      sd: 0.5 * (range / xi + iqr / eta),
      text: `Wan S3：SD = ½ × [(max − min)/ξ(n) + (Q3 − Q1)/η(n)]\nξ(${n}) = ${xi.toFixed(4)}，η(${n}) = ${eta.toFixed(4)}`,
      ref: "wan",
    };
  }
  const k = 0.07 * n ** 0.6;
  const theta1 = (2 + 2 * k) * qnorm((n - 0.375) / (n + 0.25));
  const theta2 = (2 + 2 / k) * qnorm((0.75 * n - 0.125) / (n + 0.25));
  return {
    sd: range / theta1 + iqr / theta2,
    text:
      `Shi S3：SD = (max − min)/θ₁(n) + (Q3 − Q1)/θ₂(n)\n` +
      `θ₁ = (2 + 0.14n^0.6)×Φ⁻¹((n−0.375)/(n+0.25)) = ${theta1.toFixed(4)}\n` +
      `θ₂ = (2 + 2/(0.07n^0.6))×Φ⁻¹((0.75n−0.125)/(n+0.25)) = ${theta2.toFixed(4)}`,
    ref: "shi",
  };
}

// method: "luo" (Luo mean + Wan/Shi SD) or "wan" (Wan mean + Wan SD).
function estimateFromQuantiles(method, scenario, values, n) {
  const meanPart = method === "luo" ? luoMean(scenario, values, n) : wanMean(scenario, values, n);
  const sdPart = quantileSD(method, scenario, values, n);
  const refs = [...new Set([method, sdPart.ref])].map((key) => QUANTILE_REFERENCES[key]);
  return {
    mean: meanPart.mean,
    sd: sdPart.sd,
    calculationSteps: `${meanPart.text}\n\n${sdPart.text}`,
    reference: refs.join("；"),
  };
}

// Hozo et al. (2005): piecewise rules by sample size, S1 data only.
function calculateHozoMethod(min, median, max, n) {
  const mean = n > 25 ? median : (min + 2 * median + max) / 4;
  let sd;
  let sdFormula;
  if (n <= 15) {
    sd = Math.sqrt((1 / 12) * ((min - 2 * median + max) ** 2 / 4 + (max - min) ** 2));
    sdFormula = "Formula (16): √[(a-2m+b)²/48 + (b-a)²/12]";
  } else if (n <= 70) {
    sd = (max - min) / 4;
    sdFormula = "Range/4 formula";
  } else {
    sd = (max - min) / 6;
    sdFormula = "Range/6 formula";
  }

  const calculationSteps =
    `Hozo et al. (2005) 方法 (n=${n})\n\n平均數估計：\n` +
    (n > 25
      ? `n > 25，使用中位數作為平均數估計\nMean ≈ median = ${fmt(median)}`
      : `n ≤ 25，使用修正公式\nMean = (a + 2m + b) / 4\nMean = (${fmt(min)} + 2×${fmt(median)} + ${fmt(max)}) / 4 = ${mean.toFixed(4)}`) +
    `\n\n標準差估計：\n使用 ${sdFormula}\n` +
    (n <= 15
      ? `SD = √[(${fmt(min)}-2×${fmt(median)}+${fmt(max)})²/48 + (${fmt(max)}-${fmt(min)})²/12]\n` +
        `SD = √[${((min - 2 * median + max) ** 2).toFixed(2)}/48 + ${((max - min) ** 2).toFixed(2)}/12] = ${sd.toFixed(4)}`
      : `SD = (${fmt(max)} - ${fmt(min)}) / ${n <= 70 ? "4" : "6"} = ${sd.toFixed(4)}`);

  return { mean, sd, calculationSteps, reference: QUANTILE_REFERENCES.hozo };
}
