/**
 * ROCKEYE Private Core — Pricing Engine
 * Dynamic contract settlement, index-linking, and quality deduction matrix
 */

export function calculateSettlementPrice({
  baseContractPrice = 0,
  marketIndexPrice = null,
  indexDifferential = 0,
  ffaPercentage = 5.0,
  moisturePercentage = 0.2,
  dirtPercentage = 0.05
}) {
  const referencePrice = marketIndexPrice !== null ? (marketIndexPrice + indexDifferential) : baseContractPrice;

  // FFA deduction: standard limit is 5.0%. For every 0.1% above, deduct 0.5% of price
  let ffaDeduction = 0;
  if (ffaPercentage > 5.0) {
    const excessFfaPoints = (ffaPercentage - 5.0) / 0.1;
    ffaDeduction = referencePrice * (excessFfaPoints * 0.005);
  }

  // Moisture & Dirt deduction: standard combined limit is 0.25%
  let mdDeduction = 0;
  const combinedMd = moisturePercentage + dirtPercentage;
  if (combinedMd > 0.25) {
    const excessMd = combinedMd - 0.25;
    mdDeduction = referencePrice * (excessMd / 100);
  }

  const finalSettlementPrice = Math.max(0, referencePrice - ffaDeduction - mdDeduction);

  return {
    referencePrice: Number(referencePrice.toFixed(2)),
    ffaDeduction: Number(ffaDeduction.toFixed(2)),
    mdDeduction: Number(mdDeduction.toFixed(2)),
    finalSettlementPrice: Number(finalSettlementPrice.toFixed(2)),
    hasQualityDeductions: (ffaDeduction + mdDeduction) > 0
  };
}

