// Formula Display Module
function initializeFormulas() {
  // Initialize method accordion for formula references
  document.querySelectorAll("#module-e .method-header").forEach((header) => {
    header.addEventListener("click", () => {
      const methodId = header.parentElement.querySelector(".method-content").id;
      toggleFormulaMethod(methodId);
    });
  });
}

function toggleFormulaMethod(methodId) {
  const content = document.getElementById(methodId);
  const header = content.previousElementSibling;
  const icon = header.querySelector("i");

  if (content.classList.contains("active")) {
    content.classList.remove("active");
    icon.style.transform = "rotate(0deg)";
  } else {
    content.classList.add("active");
    icon.style.transform = "rotate(180deg)";
  }
}

function showFormula(calculationType) {
  const modal = document.getElementById("formula-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");

  let title = "";
  let content = "";

  switch (calculationType) {
    case "se-sd":
      title = "SE ↔ SD 轉換公式";
      content = `
                <h4>公式</h4>
                <p><strong>SD = SE × √n</strong></p>
                <p><strong>SE = SD / √n</strong></p>
                
                <h4>說明</h4>
                <p>標準誤 (Standard Error) 和標準差 (Standard Deviation) 的關係基於樣本大小的平方根。</p>
                
                <h4>使用情境</h4>
                <ul>
                    <li>文獻中只報告 SE 但需要 SD 進行 meta-analysis</li>
                    <li>將個別研究的變異性標準化</li>
                </ul>
                
                <h4>注意事項</h4>
                <p>確保 n 是正確的樣本大小，特別是在處理分組數據時。</p>
            `;
      break;

    case "ci-mean-sd":
      title = "信賴區間 → Mean & SD 轉換";
      content = `
                <h4>公式</h4>
                <p><strong>Mean = (Upper CI + Lower CI) / 2</strong></p>
                <p><strong>SE = (Upper CI - Lower CI) / (2 × critical value)</strong></p>
                <p><strong>SD = SE × √n</strong></p>
                
                <h4>Critical Values</h4>
                <ul>
                    <li>95% CI (Normal): 1.96</li>
                    <li>90% CI (Normal): 1.645</li>
                    <li>99% CI (Normal): 2.576</li>
                    <li>t-distribution: 使用自由度 df = n-1</li>
                </ul>
                
                <h4>適用條件</h4>
                <p>假設數據來自常態分布或 t 分布（小樣本）。</p>
            `;
      break;

    case "quantiles":
      title = "次序統計 → Mean & SD 估計";
      content = `
                <h4>Luo et al. (2018) 方法</h4>
                <p><strong>完整五數摘要：</strong></p>
                <p>Mean = (min + 2×Q1 + 2×median + 2×Q3 + max) / 8</p>
                
                <h4>Wan et al. (2014) 方法</h4>
                <p><strong>三點估計：</strong></p>
                <p>Mean = (Q1 + median + Q3) / 3</p>
                
                <h4>Hozo et al. (2005) 方法 (已增強)</h4>
                <p><strong>平均數：</strong></p>
                <p>n ≤ 25: Mean = (min + 2×median + max) / 4</p>
                <p>n > 25: Mean ≈ median</p>
                <p><strong>標準差：</strong></p>
                <p>n ≤ 15: SD = √[(a-2m+b)²/48 + (b-a)²/12]</p>
                <p>15 < n ≤ 70: SD = (max - min) / 4</p>
                <p>n > 70: SD = (max - min) / 6</p>
                
                <h4>Shi et al. (2020) 方法</h4>
                <p>使用優化的加權方式，特別適合小樣本。</p>
                
                <h4>方法選擇建議</h4>
                <ul>
                    <li><strong>Luo 2018:</strong> 數據完整時的首選</li>
                    <li><strong>Wan 2014:</strong> 中等樣本大小，有四分位數</li>
                    <li><strong>Hozo 2005:</strong> 只有三點數據的快速估計</li>
                    <li><strong>Shi 2020:</strong> 小樣本或偏態分布</li>
                </ul>
            `;
      break;

    case "hozo-method":
      title = "Hozo et al. (2005) Median & Range 方法";
      content = `
                <h4>基於 Hozo et al. (2005) 論文的精確公式</h4>
                
                <h4>平均數估計</h4>
                <p><strong>小樣本 (n ≤ 25):</strong></p>
                <p>Mean = (a + 2m + b) / 4</p>
                <p>其中 a=最小值, m=中位數, b=最大值</p>
                
                <p><strong>大樣本 (n > 25):</strong></p>
                <p>Mean ≈ median</p>
                
                <h4>標準差估計</h4>
                <p><strong>極小樣本 (n ≤ 15):</strong></p>
                <p>SD = √[(a-2m+b)²/48 + (b-a)²/12]</p>
                <p>此為論文中的精確公式 (16)</p>
                
                <p><strong>中等樣本 (15 < n ≤ 70):</strong></p>
                <p>SD ≈ (b-a)/4</p>
                
                <p><strong>大樣本 (n > 70):</strong></p>
                <p>SD ≈ (b-a)/6</p>
                
                <h4>理論背景</h4>
                <ul>
                    <li>基於分布自由的不等式推導</li>
                    <li>不假設數據的特定分布</li>
                    <li>適用於各種偏態分布</li>
                    <li>在模擬研究中表現優秀</li>
                </ul>
                
                <h4>適用條件</h4>
                <ul>
                    <li>只有中位數、最小值、最大值數據</li>
                    <li>樣本大小已知</li>
                    <li>適合 meta-analysis 納入文獻</li>
                </ul>
                
                <p><strong>參考文獻：</strong>Hozo et al. (2005) Estimating the mean and variance from the median, range, and the size of a sample. BMC Medical Research Methodology, 5:13</p>
            `;
      break;

    case "md":
      title = "Mean Difference (MD) 計算";
      content = `
                <h4>公式</h4>
                <p><strong>MD = Mean₁ - Mean₂</strong></p>
                <p><strong>SE(MD) = √(SD₁²/n₁ + SD₂²/n₂)</strong></p>
                <p><strong>95% CI = MD ± 1.96 × SE(MD)</strong></p>
                
                <h4>統計檢驗</h4>
                <p><strong>Z = MD / SE(MD)</strong></p>
                <p><strong>p-value = 2 × Φ(-|Z|)</strong></p>
                
                <h4>解釋</h4>
                <ul>
                    <li>MD > 0: 實驗組效果較好</li>
                    <li>MD < 0: 對照組效果較好</li>
                    <li>MD = 0: 無差異</li>
                </ul>
                
                <h4>使用時機</h4>
                <p>當兩組使用相同的測量單位時（如血壓 mmHg、體重 kg 等）。</p>
            `;
      break;

    case "smd":
      title = "Standardized Mean Difference (SMD) 計算";
      content = `
                <h4>Cohen's d 公式</h4>
                <p><strong>Pooled SD = √[((n₁-1)×SD₁² + (n₂-1)×SD₂²) / (n₁+n₂-2)]</strong></p>
                <p><strong>Cohen's d = (Mean₁ - Mean₂) / Pooled SD</strong></p>
                
                <h4>Hedges' g (小樣本修正)</h4>
                <p><strong>J = 1 - 3/(4×df - 1)</strong>, where df = n₁ + n₂ - 2</p>
                <p><strong>Hedges' g = Cohen's d × J</strong></p>
                
                <h4>標準誤計算</h4>
                <p><strong>SE(g) = √[(n₁+n₂)/(n₁×n₂) + g²/(2×(n₁+n₂))]</strong></p>
                
                <h4>效果量解釋 (Cohen 1988)</h4>
                <ul>
                    <li><strong>小效果:</strong> |d| ≈ 0.2</li>
                    <li><strong>中等效果:</strong> |d| ≈ 0.5</li>
                    <li><strong>大效果:</strong> |d| ≈ 0.8</li>
                </ul>
                
                <h4>使用時機</h4>
                <p>當兩組使用不同的測量單位或量表時，需要標準化以便比較。</p>
            `;
      break;

    case "binary":
      title = "二分結果變項分析";
      content = `
                <h4>2×2 表格</h4>
                <table style="border-collapse: collapse; margin: 1rem 0;">
                    <tr><td></td><td><strong>事件</strong></td><td><strong>非事件</strong></td><td><strong>總計</strong></td></tr>
                    <tr><td><strong>實驗組</strong></td><td>a</td><td>b</td><td>a+b</td></tr>
                    <tr><td><strong>對照組</strong></td><td>c</td><td>d</td><td>c+d</td></tr>
                </table>
                
                <h4>Odds Ratio (OR)</h4>
                <p><strong>OR = (a×d) / (b×c)</strong></p>
                <p><strong>log(OR) = ln(a) + ln(d) - ln(b) - ln(c)</strong></p>
                <p><strong>SE[log(OR)] = √(1/a + 1/b + 1/c + 1/d)</strong></p>
                
                <h4>Risk Ratio (RR)</h4>
                <p><strong>RR = [a/(a+b)] / [c/(c+d)]</strong></p>
                <p><strong>SE[log(RR)] = √(1/a - 1/(a+b) + 1/c - 1/(c+d))</strong></p>
                
                <h4>Risk Difference (RD)</h4>
                <p><strong>RD = a/(a+b) - c/(c+d)</strong></p>
                <p><strong>SE(RD) = √[p₁(1-p₁)/(a+b) + p₂(1-p₂)/(c+d)]</strong></p>
                
                <h4>零事件修正</h4>
                <ul>
                    <li><strong>Haldane-Anscombe:</strong> 各格加 0.5</li>
                    <li><strong>Continuity Correction:</strong> 連續性修正</li>
                </ul>
            `;
      break;

    case "pooled-sd":
      title = "Pooled Standard Deviation 計算";
      content = `
                <h4>公式</h4>
                <p><strong>SDpooled = √[((n₁-1)×SD₁² + (n₂-1)×SD₂²) / (n₁+n₂-2)]</strong></p>
                
                <h4>參數說明</h4>
                <ul>
                    <li><strong>SD₁:</strong> 第一組的標準差</li>
                    <li><strong>n₁:</strong> 第一組的樣本數</li>
                    <li><strong>SD₂:</strong> 第二組的標準差</li>
                    <li><strong>n₂:</strong> 第二組的樣本數</li>
                </ul>
                
                <h4>使用時機</h4>
                <ul>
                    <li>計算 Cohen's d 或 Hedges' g 時需要合併標準差</li>
                    <li>假設兩組有相同的母群體變異數（homogeneity of variance）</li>
                    <li>適用於獨立樣本 t 檢定的效果量計算</li>
                </ul>
                
                <h4>注意事項</h4>
                <ul>
                    <li>分母為自由度 (df = n₁ + n₂ - 2)</li>
                    <li>當兩組樣本數相等時，簡化為兩個變異數的平均</li>
                    <li>不適用於配對樣本或相關樣本</li>
                </ul>
            `;
      break;

    case "change-sd":
      title = "Change Score Standard Deviation 計算";
      content = `
                <h4>公式</h4>
                <p><strong>SDchange = √(SDpre² + SDpost² - 2×r×SDpre×SDpost)</strong></p>
                
                <h4>參數說明</h4>
                <ul>
                    <li><strong>SDpre:</strong> 前測（基線）的標準差</li>
                    <li><strong>SDpost:</strong> 後測（追蹤）的標準差</li>
                    <li><strong>r:</strong> 前測與後測的相關係數 (-1 ≤ r ≤ 1)</li>
                </ul>
                
                <h4>相關係數 r 的估計</h4>
                <ul>
                    <li><strong>高相關 (r ≈ 0.7-0.9):</strong> 同一測量工具的重複測量</li>
                    <li><strong>中相關 (r ≈ 0.4-0.6):</strong> 相關但不同的測量</li>
                    <li><strong>低相關 (r ≈ 0.1-0.3):</strong> 時間間隔較長或測量變異大</li>
                    <li><strong>保守估計:</strong> 當 r 未知時，可使用 r = 0.5</li>
                </ul>
                
                <h4>使用時機</h4>
                <ul>
                    <li>計算前後測變化量的標準差</li>
                    <li>配對樣本或重複測量設計</li>
                    <li>臨床試驗的療效評估</li>
                </ul>
                
                <h4>特殊情況</h4>
                <ul>
                    <li><strong>r = 0:</strong> SDchange = √(SDpre² + SDpost²)（獨立測量）</li>
                    <li><strong>r = 1:</strong> SDchange = |SDpost - SDpre|（完全相關）</li>
                    <li><strong>SDpre = SDpost:</strong> SDchange = SD × √(2(1-r))</li>
                </ul>
            `;
      break;

    default:
      title = "計算公式";
      content = "<p>公式資訊載入中...</p>";
  }

  modalTitle.textContent = title;
  modalBody.innerHTML = content;
  modal.style.display = "block";
}

function closeModal() {
  document.getElementById("formula-modal").style.display = "none";
}

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  const modal = document.getElementById("formula-modal");
  if (event.target === modal) {
    closeModal();
  }
});
