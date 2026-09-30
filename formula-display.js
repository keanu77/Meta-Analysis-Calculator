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
                    <li>95% CI (Normal): 1.959964</li>
                    <li>90% CI (Normal): 1.644854</li>
                    <li>99% CI (Normal): 2.575829</li>
                    <li>t-distribution: 自由度 df = n-1，以精確的 t 分位數計算</li>
                    <li>自動：n &lt; 120 用 t，n ≥ 120 用常態</li>
                </ul>
                
                <h4>適用條件</h4>
                <p>僅適用於單組平均值、以平均值為中心的對稱 CI。兩組差值 (MD) 的 CI 需另行換算（Cochrane Handbook §6.5.2.3）。</p>
            `;
      break;

    case "quantiles":
      title = "次序統計 → Mean & SD 估計";
      content = `
                <h4>資料情境（Wan 2014）</h4>
                <ul>
                    <li><strong>S1：</strong>min、median、max</li>
                    <li><strong>S2：</strong>Q1、median、Q3</li>
                    <li><strong>S3：</strong>min、Q1、median、Q3、max（五數摘要）</li>
                </ul>
                <p>工具依填入的欄位自動判斷情境（min/max、Q1/Q3 需成對）。</p>

                <h4>平均數：Luo et al. (2018)（建議）</h4>
                <p>S1：Mean = w×(min+max)/2 + (1−w)×median，w = 4/(4+n<sup>0.75</sup>)</p>
                <p>S2：Mean = w×(Q1+Q3)/2 + (1−w)×median，w = 0.7 + 0.39/n</p>
                <p>S3：Mean = w₁×(min+max)/2 + w₂×(Q1+Q3)/2 + (1−w₁−w₂)×median，w₁ = 2.2/(2.2+n<sup>0.75</sup>)，w₂ = 0.7 − 0.72/n<sup>0.55</sup></p>

                <h4>平均數：Wan et al. (2014)</h4>
                <p>S1：Mean = (min + 2×median + max)/4 + (min − 2×median + max)/(4n)</p>
                <p>S2：Mean = (Q1 + median + Q3)/3</p>
                <p>S3：Mean = (min + 2×Q1 + 2×median + 2×Q3 + max)/8</p>

                <h4>標準差</h4>
                <p>ξ(n) = 2Φ⁻¹((n−0.375)/(n+0.25))，η(n) = 2Φ⁻¹((0.75n−0.125)/(n+0.25))；小樣本（range n ≤ 50、IQR n ≤ 201）使用 Wan 論文附表的精確值。</p>
                <p>S1（Wan）：SD = (max − min)/ξ(n)</p>
                <p>S2（Wan）：SD = (Q3 − Q1)/η(n)</p>
                <p>S3（Wan）：SD = ½ × [(max − min)/ξ(n) + (Q3 − Q1)/η(n)]</p>
                <p>S3（Shi 2020，搭配 Luo 使用）：SD = (max − min)/θ₁(n) + (Q3 − Q1)/θ₂(n)，θ₁ = (2 + 0.14n<sup>0.6</sup>)×Φ⁻¹((n−0.375)/(n+0.25))，θ₂ = (2 + 2/(0.07n<sup>0.6</sup>))×Φ⁻¹((0.75n−0.125)/(n+0.25))</p>

                <h4>方法選擇建議</h4>
                <ul>
                    <li><strong>Luo + Wan/Shi（建議）：</strong>平均數用 Luo 2018，SD 在 S1/S2 用 Wan 2014、S3 用 Shi 2020；與 R 套件 meta 的預設一致。</li>
                    <li><strong>Wan 2014：</strong>平均數與 SD 都用 Wan 公式，可作敏感度分析。</li>
                    <li><strong>Hozo 2005：</strong>僅 S1，已被上述方法取代，保留作教學對照。</li>
                </ul>

                <h4>限制</h4>
                <p>以上方法都假設資料近似常態。若中位數明顯偏離範圍或四分位距的中點（偏態），估計會有偏差，可考慮 McGrath et al. (2020) 的 QE/BC 方法或敏感度分析。</p>
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
                
                <h4>理論背景與限制</h4>
                <ul>
                    <li>以不等式推導上下界，再依樣本數分段取經驗規則</li>
                    <li>n = 25/26 與 n = 70/71 兩處切換會讓估計值跳動</li>
                    <li>Wan et al. (2014) 的模擬顯示其 SD 估計偏差較大，現行建議改用 Luo/Wan 方法</li>
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
                <p><strong>95% CI = MD ± 1.959964 × SE(MD)</strong></p>
                
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
                <p><strong>SE(d) = √[(n₁+n₂)/(n₁×n₂) + d²/(2×(n₁+n₂))]</strong></p>
                <p><strong>SE(g) = J × SE(d)</strong>（Borenstein et al. 2009）</p>
                <p>各組樣本數需 ≥ 2。RevMan 使用略有不同的近似 SE(g) = √[N/(n₁n₂) + g²/(2(N−3.94))]。</p>
                
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
                <p>CI 以 Wald 近似計算，事件極少或極多時可能超出 [−1, 1]。</p>
                
                <h4>零事件處理</h4>
                <ul>
                    <li><strong>Haldane-Anscombe：</strong>任一格為 0 時四格各加 0.5，只用於 OR/RR</li>
                    <li><strong>RD：</strong>一律用原始計數，不需修正</li>
                    <li><strong>兩組皆無事件（或皆全部發生）：</strong>OR/RR 無法估計，此研究對相對效果不提供資訊</li>
                    <li>稀有事件的統合分析可考慮 Peto 或 Mantel-Haenszel 方法（Cochrane Handbook §10.4.4）</li>
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

    case "es-conversion":
      title = "效果量 CI ↔ SE 轉換";
      content = `
                <h4>公式</h4>
                <p><strong>SE = (上界 − 下界) / (2 × z)</strong></p>
                <p><strong>CI = 效果量 ± z × SE</strong></p>
                <p>z：90% = 1.644854，95% = 1.959964，99% = 2.575829</p>

                <h4>比值型效果量（OR、RR、HR）</h4>
                <p>比值的 CI 在原始尺度不對稱，需先取自然對數：</p>
                <p><strong>SE[ln(OR)] = (ln(上界) − ln(下界)) / (2 × z)</strong></p>
                <p>選「OR／RR／HR」時直接輸入原始比值（例如 1.5 [1.1, 2.0]），工具會自動取對數；選「ln(OR)」等選項時，輸入值須已是對數尺度。</p>

                <h4>一致性檢查</h4>
                <ul>
                    <li>效果量落在 CI 外：視為輸入錯誤</li>
                    <li>效果量偏離 CI 中點超過半寬的 10%：提示 CI 可能不對稱</li>
                    <li>輸入的 SE 與 CI 推得的 SE 相差超過 10%：提示並改用 CI 推得的 SE</li>
                </ul>

                <h4>限制</h4>
                <p>假設 CI 為對稱的常態（Wald）區間。小樣本連續資料的 CI 若以 t 分布建構，由 CI 推得的 SE 會略為高估（Cochrane Handbook §6.5.2.3）。</p>
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
