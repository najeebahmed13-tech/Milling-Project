const parameter = (code, name, uom = "%", dataType = "DECIMAL", material = "BOTH", precision = 2) => ({ code, name, uom, dataType, material, precision });

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
  return STATION_QUALITY_STANDARDS.flatMap((station) => station.parameters.map((item, index) => ({
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
    targetValue: "",
    minLimit: null,
    maxLimit: null,
    warningMin: null,
    warningMax: null,
    mandatory: false,
    sampleCount: 1,
    aggregationMethod: "NONE",
    passFailRule: "IN_RANGE",
    remarksRequiredOnFailure: false,
    correctiveActionRequired: false,
    effectiveFrom: "2026-01-01",
    status: "ACTIVE",
  })));
}
