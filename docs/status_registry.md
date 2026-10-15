# Canonical Status Registry

This registry is the source of truth for status codes, display labels, meanings, and presentation colors. The runtime mapping is maintained in `src/design-system/status-registry.js`; UI badges resolve through the shared `StatusBadge` component.

Color roles use the design-system tokens: success `#13845B`, danger `#D51C2A`, warning `#AA7207`, info `#3977D4`, and neutral `#667085`.

| Module | Status Code | Display Label | Meaning | Semantic Color | HEX Code | Usage |
|---|---|---|---|---|---|---|
| Commercial / Receiving / Logistics | `DRAFT` | Draft | Created but not submitted | Neutral | `#667085` | Draft records |
| Contracts | `SUBMITTED` | Submitted | Awaiting approval | Warning | `#AA7207` | Contract approval |
| Contracts / Credit | `APPROVED` | Approved | Approved for next step | Success | `#13845B` | Approvals |
| Contracts / Quality | `REJECTED` | Rejected | Rejected by decision | Danger | `#D51C2A` | Decisions |
| Masters / Contracts | `ACTIVE` | Active | Available for use | Success | `#13845B` | Master and contract records |
| Masters | `INACTIVE` | Inactive | Retained but unavailable | Neutral | `#667085` | Master records |
| Transporter Master | `SUSPENDED` | Suspended | Temporarily blocked | Danger | `#D51C2A` | Transporter records |
| Commercial / Receiving / Logistics | `CANCELLED` | Cancelled | Workflow cancelled | Danger | `#D51C2A` | Terminal status |
| Production / Logistics | `COMPLETED` | Completed | Terminal successful state | Success | `#13845B` | Completion |
| Receiving / Inventory | `POSTED` | Posted | Posted to system of record | Success | `#13845B` | Operational posting |
| Inventory | `VOIDED` | Voided | Posted record voided | Danger | `#D51C2A` | Controlled correction |
| Inventory / Contracts | `REVERSED` | Reversed | Posted movement reversed | Danger | `#D51C2A` | Controlled correction |
| Receiving | `WEIGHING` | Weighing | Weighbridge capture active | Info | `#3977D4` | Receipt workflow |
| Receiving | `GRADING` | Grading | Quality grading active/pending | Info | `#3977D4` | Receipt workflow |
| Receiving | `GRADING_COMPLETED` | Grading completed | Quality grading completed | Success | `#13845B` | Receipt workflow |
| Receiving | `FIRST_WEIGHT_RECORDED` | First weighing recorded | First weighing captured | Info | `#3977D4` | Receipt workflow |
| Receiving | `READY_TO_POST` | Ready to post | Validated and ready to post | Success | `#13845B` | Receipt workflow |
| Receiving | `PENDING_SECOND_WEIGHING` | Pending second weighing | Waiting for exit weighing | Warning | `#AA7207` | Receipt workflow |
| Commercial | `PLANNED` | Planned | Delivery planned for execution | Info | `#3977D4` | Delivery requests |
| Logistics | `AWAITING_LOGISTICS` | Awaiting logistics | Waiting for assignment | Warning | `#AA7207` | Loading Plans |
| Logistics (legacy) | `PENDING_LOGISTICS_ASSIGNMENT` | Awaiting logistics | Waiting for assignment | Warning | `#AA7207` | Legacy loading-plan records |
| Commercial / Logistics | `ASSIGNED` | Assigned | Transport resources assigned | Info | `#3977D4` | Dispatch workflow |
| Logistics | `LOADING_IN_PROGRESS` | Loading in progress | Loading started and open | Info | `#3977D4` | Loading Plans |
| Logistics | `LOADED` | Loaded | Loading completed | Success | `#13845B` | Loading Plans |
| Logistics | `DISPATCHED` | Dispatched | Dispatch recorded/released | Info | `#3977D4` | Loading Plans |
| Commercial / Logistics | `FULFILLED` | Fulfilled | Delivery workflow fulfilled | Success | `#13845B` | Delivery requests |
| Quality / Receiving | `PENDING` | Pending | Action or decision incomplete | Warning | `#AA7207` | Open work |
| Quality / Production | `IN_PROGRESS` | In progress | Work started and open | Info | `#3977D4` | Execution |
| Quality / Logistics | `READY_FOR_LOADING` | Ready for loading | Prerequisites satisfied | Success | `#13845B` | Dispatch readiness |
| Quality | `RELEASED` | Released | Quality released material | Success | `#13845B` | Quality decisions |
| Inventory Dispatch | `QUALITY_PENDING` | Quality pending | Quality decision required | Warning | `#AA7207` | Dispatch gating |
| Inventory Dispatch | `QUALITY_RELEASED` | Quality released | Dispatch released by quality | Success | `#13845B` | Dispatch gating |
| Quality / Production | `PASS` | Pass | Result passed | Success | `#13845B` | Quality checks |
| Quality / Production | `REVIEW` | Review | Result needs review | Warning | `#AA7207` | Quality checks |
| Quality / Production | `OUT_OF_SPEC` | Out of spec | Result outside specification | Danger | `#D51C2A` | Quality checks |
| Quality / System | `FAILED` | Failed | Operation or validation failed | Danger | `#D51C2A` | Errors |
| System / Workflows | `BLOCKED` | Blocked | Blocking condition unresolved | Danger | `#D51C2A` | Workflow gating |
| Inventory Dispatch | `ORDERED` | Ordered | Dispatch order created | Neutral | `#667085` | Dispatch orders |
| Inventory Dispatch | `EMPTY_WEIGHED` | Empty weighed | Empty vehicle weighing complete | Info | `#3977D4` | Dispatch orders |
| Inventory Dispatch | `LOADING` | Loading | Dispatch loading active | Info | `#3977D4` | Dispatch orders |
| Quality / Logistics | `NOT_RECORDED` | Not recorded | Expected result not entered | Neutral | `#667085` | Checklists |
| Receiving / Quality | `RECORDED` | Recorded | Observation or measurement recorded | Success | `#13845B` | Operational records |
| Receiving | `CERTIFIED` | Certified | Measurement/result certified | Success | `#13845B` | Weighment |
| Receiving | `NOT_CERTIFIED` | Not certified | Certification unavailable | Warning | `#AA7207` | Weighment |
| Details | `TBA` | TBA | Required workflow action is pending | Warning | `#AA7207` | Missing-data rule |

## Change rule

Every new status must be added to this registry and `src/design-system/status-registry.js` before it is used. A status entry requires a canonical code, display label, meaning, module usage, semantic color, and valid HEX code. Business logic must continue to use the canonical code; display labels and colors belong to the presentation layer.
