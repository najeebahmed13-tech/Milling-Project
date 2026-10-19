const parameter = (code, name, uom = "%", dataType = "DECIMAL", material = "BOTH", precision = 2) => ({ code, name, uom, dataType, material, precision });

const CLARIFICATION_RULES = Object.freeze({
  "CLR-FFA": { targetValue: "3.5", minLimit: 0, maxLimit: 5, warningMin: 0, warningMax: 4.5, allowedVariancePercent: 5 },
  "CLR-MOIST": { targetValue: "0.25", minLimit: 0, maxLimit: 0.5, warningMin: 0, warningMax: 0.35, allowedVariancePercent: 5 },
  "CLR-IMP": { targetValue: "0.1", minLimit: 0, maxLimit: 0.5, warningMin: 0, warningMax: 0.3, allowedVariancePercent: 5 },
  "CLR-DOBI": { targetValue: "2.5", minLimit: 2.3, maxLimit: 3, warningMin: 2.4, warningMax: 2.9, allowedVariancePercent: 3 },
  "CLR-COLOR": { targetValue: "3", minLimit: 0, maxLimit: 6, warningMin: 0, warningMax: 5, allowedVariancePercent: 5 },
  "CLR-NOS": { targetValue: "0.5", minLimit: 0, maxLimit: 1, warningMin: 0, warningMax: 0.8, allowedVariancePercent: 5 },
  "CLR-DIRT": { targetValue: "0.05", minLimit: 0, maxLimit: 0.2, warningMin: 0, warningMax: 0.15, allowedVariancePercent: 5 },
});

const PK_PARAMETERS = Object.freeze([
  { code: "TANK-MOIST", parameter: "Moisture", dataType: "DECIMAL", uom: "%", material: "PK", targetValue: "7", minLimit: 0, maxLimit: 10, warningMin: 0, warningMax: 8, allowedVariancePercent: 5, sequence: 1, passFailRule: "IN_RANGE" },
  { code: "TANK-IMP", parameter: "Impurities", dataType: "DECIMAL", uom: "%", material: "PK", targetValue: "1", minLimit: 0, maxLimit: 3, warningMin: 0, warningMax: 2, allowedVariancePercent: 5, sequence: 2, passFailRule: "IN_RANGE" },
  { code: "TANK-COLOR", parameter: "Color", dataType: "DECIMAL", uom: "", material: "PK", targetValue: "3", minLimit: 0, maxLimit: 6, warningMin: 0, warningMax: 5, allowedVariancePercent: 5, sequence: 3, passFailRule: "IN_RANGE" },
  { code: "TANK-NOS", parameter: "NOS", dataType: "DECIMAL", uom: "%", material: "PK", targetValue: "2", minLimit: 0, maxLimit: 5, warningMin: 0, warningMax: 4, allowedVariancePercent: 5, sequence: 4, passFailRule: "IN_RANGE" },
]);

export const STATION_QUALITY_STANDARDS = Object.freeze([
  { stationCode: "ST-STER", stationName: "Sterilization", parameters: [
    parameter("STER-COND-VOL", "Condensate Volume", "m³"), parameter("STER-COND-OIL", "Condensate Oil Content"), parameter("STER-COND-LOSS", "Oil Loss in Condensate (% on FFB)")
  ] },
  { stationCode: "ST-THRESH", stationName: "Threshing", parameters: [
    parameter("THR-UNSTRIP", "Unstripped Bunches"), parameter("THR-EFB-FRUIT", "Fruit Remaining in EFB"), parameter("THR-EFB-LOSS", "Oil Loss in EFB"), parameter("THR-EFB-REC", "Oil Recovered from EFB (% on FFB)"), parameter("THR-EFB-MOIST", "Pressed EFB Moisture")
  ] },
  { stationCode: "ST-DIGEST", stationName: "Digester", parameters: [
    parameter("DIG-CRUDE-TEMP", "Crude Oil Temperature", "°C"), parameter("DIG-MOIST", "Moisture"), parameter("DIG-CRUDE-COMP", "Crude Oil Composition", "", "TEXT"), parameter("DIG-OIL", "Oil"), parameter("DIG-WATER", "Water"), parameter("DIG-NOS", "NOS"), parameter("DIG-CAKE-MOIST", "Press Cake Moisture"), parameter("DIG-CAKE-OIL", "Oil in Press-Cake Fibre"), parameter("DIG-NUT-BREAK", "Nut Breakage")
  ] },
  { stationCode: "ST-PRESS", stationName: "Pressing", parameters: [
    parameter("PRS-OIL-LOSS", "Oil Loss"), parameter("PRS-BROKEN-NUT", "Broken Nut"), parameter("PRS-MOIST", "Moisture"), parameter("PRS-OIL-DB", "Oil to Dry Basis (DB)"), parameter("PRS-OIL-WB", "Oil to Wet Basis (WB)"), parameter("PRS-OIL-NOS", "Oil to Non Oil Solids (NOS)"), parameter("PRS-FFB-LOSS", "Loss to FFB (600°VB/5000)")
  ] },
  { stationCode: "ST-CLAR", stationName: "Clarification", parameters: [
    parameter("CLR-FFA", "FFA"), parameter("CLR-MOIST", "Moisture"), parameter("CLR-IMP", "Impurities"), parameter("CLR-DOBI", "DOBI", "ratio"), parameter("CLR-COLOR", "Color"), parameter("CLR-NOS", "NOS"), parameter("CLR-DIRT", "Dirt")
  ] },
  { stationCode: "ST-PURE", stationName: "Purification", parameters: [
    parameter("PUR-FFA", "FFA"), parameter("PUR-MOIST", "Moisture"), parameter("PUR-IMP", "Impurities"), parameter("PUR-DOBI", "DOBI", "ratio"), parameter("PUR-COLOR", "Color"), parameter("PUR-NOS", "NOS"), parameter("PUR-DIRT", "Dirt")
  ] },
  { stationCode: "ST-VAC-DRY", stationName: "Vaccum Dryer", parameters: [
    parameter("VAC-MOIST", "Moisture"), parameter("VAC-IMP", "Impurities"), parameter("VAC-DOBI", "DOBI", "ratio"), parameter("VAC-COLOR", "Color"), parameter("VAC-NOS", "NOS")
  ] },
  { stationCode: "ST-CPO-TANK", stationName: "CPO Tank", parameters: [
    parameter("TANK-MOIST", "Moisture"), parameter("TANK-IMP", "Impurities"), parameter("TANK-DOBI", "DOBI", "ratio"), parameter("TANK-COLOR", "Color"), parameter("TANK-NOS", "NOS")
  ] },
]);

export const STATION_QUALITY_PARAMETER_SEEDS = Object.freeze(STATION_QUALITY_STANDARDS.flatMap((station) => station.parameters.map((item) => ({
  id: `QPAR-${item.code}`,
  ...item,
  description: `${item.name} captured during ${station.stationName} periodic laboratory testing.`,
  active: true,
}))));

export function stationQualityCheckpointSeeds() {
  return [...STATION_QUALITY_STANDARDS.flatMap((station) => {
    if (station.stationName === "Clarification") {
      const parameters = station.parameters.map((item, index) => ({
        ...item,
        ...CLARIFICATION_RULES[item.code],
        parameter: item.name,
        sequence: index + 1,
        passFailRule: "IN_RANGE",
      }));
      const first = parameters[0];
      return [{
        code: "QC-CLR-QUALITY",
        name: "Clarification Production Quality",
        process: station.stationName,
        operationStage: station.stationName,
        frequency: "DAY",
        samplingFrequency: "PERIODIC",
        sequence: 1,
        parameter: first.name,
        dataType: first.dataType,
        uom: first.uom,
        targetValue: first.targetValue,
        minLimit: first.minLimit,
        maxLimit: first.maxLimit,
        warningMin: first.warningMin,
        warningMax: first.warningMax,
        allowedVariancePercent: first.allowedVariancePercent,
        mandatory: true,
        sampleCount: 1,
        aggregationMethod: "NONE",
        passFailRule: "IN_RANGE",
        parameters,
        remarksRequiredOnFailure: false,
        correctiveActionRequired: false,
        effectiveFrom: "2026-01-01",
        status: "ACTIVE",
      }];
    }
    return station.parameters.map((item, index) => ({
    code: `QC-${item.code}`,
    name: `${station.stationName} · ${item.name}`,
    process: station.stationName,
    operationStage: station.stationName,
    frequency: "DAY",
    samplingFrequency: "PERIODIC",
    sequence: index + 1,
    parameter: item.name,
    dataType: item.dataType,
    uom: item.uom,
    targetValue: CLARIFICATION_RULES[item.code]?.targetValue || "",
    minLimit: CLARIFICATION_RULES[item.code]?.minLimit ?? null,
    maxLimit: CLARIFICATION_RULES[item.code]?.maxLimit ?? null,
    warningMin: CLARIFICATION_RULES[item.code]?.warningMin ?? null,
    warningMax: CLARIFICATION_RULES[item.code]?.warningMax ?? null,
    allowedVariancePercent: CLARIFICATION_RULES[item.code]?.allowedVariancePercent ?? null,
    mandatory: false,
    sampleCount: 1,
    aggregationMethod: "NONE",
    passFailRule: "IN_RANGE",
    remarksRequiredOnFailure: false,
    correctiveActionRequired: false,
    effectiveFrom: "2026-01-01",
    status: "ACTIVE",
  }));
  }), {
    code: "QC-PK-QUALITY",
    name: "Palm Kernel (PK) Quality",
    process: "CPO Tank",
    operationStage: "Palm Kernel storage",
    frequency: "DAY",
    samplingFrequency: "PERIODIC",
    sequence: 2,
    parameter: PK_PARAMETERS[0].parameter,
    dataType: PK_PARAMETERS[0].dataType,
    uom: PK_PARAMETERS[0].uom,
    targetValue: PK_PARAMETERS[0].targetValue,
    minLimit: PK_PARAMETERS[0].minLimit,
    maxLimit: PK_PARAMETERS[0].maxLimit,
    warningMin: PK_PARAMETERS[0].warningMin,
    warningMax: PK_PARAMETERS[0].warningMax,
    allowedVariancePercent: PK_PARAMETERS[0].allowedVariancePercent,
    mandatory: true,
    sampleCount: 1,
    aggregationMethod: "NONE",
    passFailRule: "IN_RANGE",
    parameters: PK_PARAMETERS,
    remarksRequiredOnFailure: false,
    correctiveActionRequired: false,
    effectiveFrom: "2026-01-01",
    status: "ACTIVE",
  }];
}
