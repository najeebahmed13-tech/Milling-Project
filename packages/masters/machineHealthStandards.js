const metric = (code, name, uom = "%", dataType = "DECIMAL") => ({ code, name, uom, dataType });

export const MACHINE_HEALTH_STANDARDS = Object.freeze([
  { stationCode: "ST-THRESH", stationName: "Threshing", metrics: [
    metric("THR-DRUM-RPM", "Drum Rotation Speed", "RPM"), metric("THR-TEMP", "Temperature", "°C"), metric("THR-THROUGHPUT", "Throughput Rate", "tons FFB/hr"), metric("THR-MOTOR-LOAD", "Motor Load", "AMPS"), metric("THR-LOOSE-FRUIT", "Loose Fruit", "MT"), metric("THR-EFB", "EFB", "MT")
  ] },
  { stationCode: "ST-DIGEST", stationName: "Digester", metrics: [
    metric("DIG-DRUM-RPM", "Drum Rotation Speed", "RPM"), metric("DIG-TEMP", "Temperature", "°C"), metric("DIG-VIBRATION", "Vibration", "mm/s")
  ] },
  { stationCode: "ST-PRESS", stationName: "Pressing", metrics: [
    metric("PRS-OIL", "Oil", "%"), metric("PRS-CRUDE-OIL", "Crude Oil Quantity", "MT"), metric("PRS-OIL-FLOW", "Oil Flow Rate", "MT/hr"), metric("PRS-PRESS-CAKE", "Press Cake", "MT"), metric("PRS-FIBER", "Fiber Quantity", "MT"), metric("PRS-NUT", "Nut Quantity", "MT"), metric("PRS-MOIST", "Moisture", "%"), metric("PRS-OIL-CONTENT", "Oil Content", "%"), metric("PRS-DRUM-RPM", "Drum Rotation Speed", "RPM"), metric("PRS-HYDRAULIC", "Hydraulic Pressure", "bar")
  ] },
  { stationCode: "ST-CLAR", stationName: "Clarification", metrics: [
    metric("CLR-TEMP", "Clarifier Temperature", "°C"), metric("CLR-TANK-LEVEL", "Tank Level", "%"), metric("CLR-OIL-TEMP", "Oil Temperature", "°C"), metric("CLR-VIBRATION", "Vibration", "mm/s"), metric("CLR-CPO", "CPO Quantity", "MT"), metric("CLR-SLUDGE", "Sludge Quantity", "MT")
  ] },
  { stationCode: "ST-PURE", stationName: "Purification", metrics: [
    metric("PUR-TEMP", "Clarifier Temperature", "°C"), metric("PUR-TANK-LEVEL", "Tank Level", "%"), metric("PUR-OIL-TEMP", "Oil Temperature", "°C"), metric("PUR-VIBRATION", "Vibration", "mm/s"), metric("PUR-CPO", "CPO Quantity", "MT")
  ] },
  { stationCode: "ST-VAC-DRY", stationName: "Vaccum Dryer", metrics: [
    metric("VAC-LEVEL", "Vacuum Level", "kPa"), metric("VAC-STEAM-PRESSURE", "Steam Pressure", "bar"), metric("VAC-STEAM-TEMP", "Steam Temperature", "°C"), metric("VAC-STEAM-CONS", "Steam Consumption", "kg/hr")
  ] },
  { stationCode: "ST-CPO-TANK", stationName: "CPO Tank", metrics: [
    metric("TANK-CURRENT-PRODUCT", "Current Product", "", "TEXT"), metric("TANK-OIL-QTY", "Oil Quantity", "MT"), metric("TANK-TEMP", "Temperature", "°C"), metric("TANK-DENSITY", "Density", "kg/m³")
  ] },
]);

export const MACHINE_HEALTH_PARAMETER_SEEDS = Object.freeze(MACHINE_HEALTH_STANDARDS.flatMap((station) => station.metrics.map((item) => ({
  id: `MHC-${item.code}`,
  code: item.code,
  name: item.name,
  stationCode: station.stationCode,
  stationName: station.stationName,
  machineCode: "",
  machineName: "",
  frequency: "PERIODIC",
  intervalMinutes: 60,
  dataType: item.dataType,
  uom: item.uom,
  warningMin: "",
  warningMax: "",
  criticalMin: "",
  criticalMax: "",
  required: false,
  notes: `Periodic machine-health monitoring for ${station.stationName}.`,
  active: true,
}))));
