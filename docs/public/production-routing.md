# Production Routing and Execution

## Implemented scope

The Production module now contains three connected areas:

- **Production Runs** — checks received FFB availability and line capacity, creates a run from an active routing, executes stages in sequence, records stage quantities/losses, captures process quality results, and completes the run.
- **Routing** — stores a versioned FFB manufacturing sequence and displays each station, machine, input/output material, duration, and quality frequency in order. New routings can be created with additional stages.
- **Masters** — maintains production lines, mill stations, machines, shift capacity, station assignments, and rated machine capacity. Stations represent physical or functional mill sections used by routing, equipment, execution, and quality checkpoints.

## Seeded FFB-to-CPO/PK route

1. FFB Ramp Feed
2. Sterilization
3. Threshing
4. Digesting and Pressing
5. Oil Clarification
6. Vacuum Drying and CPO Storage
7. Nut and Kernel Recovery

This route follows the process families confirmed in the supplied SOH mill flowchart. Its quantities, durations, sampling intervals, and output yields remain configurable operational data rather than fixed engineering formulas.

## Production start rules

A production run requires:

- an active routing;
- an active production line;
- a positive planned FFB quantity;
- enough FFB from inbound receipts in `READY_TO_POST` state after quantities already allocated to production runs are deducted;
- enough production-line capacity after planned/in-progress run reservations are deducted.

Starting a production run creates one execution stage for every step in the selected routing. A stage cannot start until all preceding stages are completed.

## Execution and completion

Each stage records input quantity, output quantity, loss quantity, remarks, start time, completion time, and process status. Quality tests can be recorded against any started/completed stage and include parameter, value, UOM, status, tester, timestamp, and remarks.

All routing stages must be completed before the production run can be completed. Completion posts CPO to `CPO Tank 01` and Palm Kernel to `Kernel Silo`, updates the production inventory balance, and updates the existing Stock snapshot.

## Extension architecture

The database separates route definitions from execution records. New lines, machines, stations, routing versions, route steps, output materials, and quality checkpoints can therefore be added without changing the production-run schema. Future work can add approved mass-balance formulas, lot-level material movements, equipment telemetry, downtime, quality specifications, hold/release rules, shift calendars, and controlled reversals over the same core structure.
