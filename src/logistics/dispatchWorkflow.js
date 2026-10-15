export const getLoadingPlanNextAction = (plan = {}) => {
  if (!plan.transporter) return ["assign", "Assign Logistics"];
  if (!plan.vehicleArrivedAt || !plan.emptyWeighmentAt) {
    return ["arrival", "Vehicle Arrival & First Weighment"];
  }
  if (!plan.preLoadingChecklistAt) return ["pre", "Pre-Loading Checklist"];
  if (!plan.loadingStartedAt) return ["start", "Start Loading"];
  if (!plan.loadingCompletedAt) {
    return ["load", "Record Loading Complete"];
  }
  if (!plan.sampleCollectedAt || !plan.qualityReleased) {
    return ["sample", "Sample Collection / Quality"];
  }
  if (!plan.sealRecordedAt) return ["seal", "Record Seal Number"];
  if (!plan.postLoadingChecklistAt) return ["post", "Post-Loading Checklist"];
  if (!plan.secondWeighmentAt || !plan.vehicleExitAt) {
    return ["exit", "Second Weighment & Vehicle Exit"];
  }
  return [null, "Completed"];
};

export const getLoadingPlanExecutionSteps = (plan = {}) => [
  {
    key: "arrival-weighment",
    label: "Vehicle arrival & first weighment",
    done: Boolean(plan.vehicleArrivedAt && plan.emptyWeighmentAt),
    value: plan.emptyWeighmentAt ? "Tare captured" : "Pending",
  },
  {
    key: "pre-loading",
    label: "Pre-loading checklist",
    done: Boolean(plan.preLoadingChecklistAt),
    value: plan.preLoadingChecklistAt ? "Completed" : "Pending",
  },
  {
    key: "loading",
    label: "Loading / sample / seal",
    done: Boolean(plan.sealRecordedAt || plan.sealNumbers),
    value: plan.sealRecordedAt ? "Completed" : "Pending",
  },
  {
    key: "post-loading",
    label: "Post-loading checklist",
    done: Boolean(plan.postLoadingChecklistAt),
    value: plan.postLoadingChecklistAt ? "Completed" : "Pending",
  },
  {
    key: "second-weighment-exit",
    label: "Second weighment & vehicle exit",
    done: Boolean(plan.secondWeighmentAt && plan.vehicleExitAt),
    value: plan.vehicleExitAt ? "Completed" : "Pending",
  },
];
