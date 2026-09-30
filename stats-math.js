// Numerical distribution functions shared by the calculators.
// Classic script: functions are globals, loaded before calculator-core.js.

// Standard normal CDF, West (2005) double-precision form of Hart (1968).
// Accurate in both tails, so small two-sided p values are not rounded to zero.
function normalCDF(x) {
  if (Number.isNaN(x)) return NaN;
  const abs = Math.abs(x);
  let tail;
  if (abs > 37) {
    tail = 0;
  } else {
    const e = Math.exp((-abs * abs) / 2);
    if (abs < 7.07106781186547) {
      let num = 3.52624965998911e-2 * abs + 0.700383064443688;
      num = num * abs + 6.37396220353165;
      num = num * abs + 33.912866078383;
      num = num * abs + 112.079291497871;
      num = num * abs + 221.213596169931;
      num = num * abs + 220.206867912376;
      let den = 8.83883476483184e-2 * abs + 1.75566716318264;
      den = den * abs + 16.064177579207;
      den = den * abs + 86.7807322029461;
      den = den * abs + 296.564248779674;
      den = den * abs + 637.333633378831;
      den = den * abs + 793.826512519948;
      den = den * abs + 440.413735824752;
      tail = (e * num) / den;
    } else {
      let den = abs + 0.65;
      den = abs + 4 / den;
      den = abs + 3 / den;
      den = abs + 2 / den;
      den = abs + 1 / den;
      tail = e / den / 2.506628274631;
    }
  }
  return x > 0 ? 1 - tail : tail;
}

// Two-sided p value from a z statistic, computed from the tail directly.
function twoSidedPFromZ(z) {
  return 2 * normalCDF(-Math.abs(z));
}

// Inverse standard normal CDF: Acklam's rational approximation plus one
// Halley refinement step against normalCDF (relative error ~1e-15).
function qnorm(p) {
  if (!(p > 0 && p < 1)) return NaN;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  let x;
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - low) {
    const q = p - 0.5;
    const r = q * q;
    x = ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const e = normalCDF(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp((x * x) / 2);
  return x - u / (1 + (x * u) / 2);
}

// log Γ(x), Lanczos approximation (g = 7, n = 9).
function logGamma(x) {
  const g = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  const z = x - 1;
  let sum = g[0];
  for (let i = 1; i < 9; i++) sum += g[i] / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

// Continued fraction for the regularized incomplete beta (modified Lentz).
function betaContinuedFraction(x, a, b) {
  const tiny = 1e-300;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < tiny) d = tiny;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d;
    if (Math.abs(d) < tiny) d = tiny;
    c = 1 + aa / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-15) break;
  }
  return h;
}

function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2)
    ? (front * betaContinuedFraction(x, a, b)) / a
    : 1 - (front * betaContinuedFraction(1 - x, b, a)) / b;
}

// Student t CDF for df > 0.
function studentTCDF(t, df) {
  if (Number.isNaN(t) || !(df > 0)) return NaN;
  const tail = 0.5 * regularizedBeta(df / (df + t * t), df / 2, 0.5);
  return t > 0 ? 1 - tail : tail;
}

// Inverse Student t CDF by bisection (monotone, converges to machine precision).
function qt(p, df) {
  if (!(p > 0 && p < 1) || !(df > 0)) return NaN;
  if (p === 0.5) return 0;
  if (p < 0.5) return -qt(1 - p, df);
  let low = 0;
  let high = Math.max(2, qnorm(p) * 2);
  while (studentTCDF(high, df) < p) {
    high *= 2;
    if (high > 1e12) return NaN;
  }
  for (let i = 0; i < 200 && high - low > 1e-13 * high; i++) {
    const mid = (low + high) / 2;
    if (studentTCDF(mid, df) < p) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// Two-sided critical values for a confidence level given in percent.
function getCriticalValueZ(ciLevel) {
  if (!(ciLevel > 0 && ciLevel < 100)) return NaN;
  return qnorm(1 - (100 - ciLevel) / 200);
}

function getCriticalValueT(ciLevel, df) {
  if (!(ciLevel > 0 && ciLevel < 100) || !(df > 0)) return NaN;
  return qt(1 - (100 - ciLevel) / 200, df);
}
