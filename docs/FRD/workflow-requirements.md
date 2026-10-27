# Workflow and Approval Requirements

## Workflow entities

Workflow, Workflow Version, Trigger, Condition, Step, Approver Resolution, Assignment, Decision, Delegation, Escalation, and Audit Event are platform entities.

## Supported actions

Submit, approve, reject, send back, cancel, delegate, escalate, withdraw, post, reverse, and close. The available actions are configured per document type and state.

## Requirements

- workflows are effective-dated and versioned;
- conditions can evaluate tenant, company, mill, amount, quantity, quality result, tolerance, material, risk, and role context;
- approvers resolve from role, user, department, location, or configured authority matrix;
- parallel and sequential approval are supported where required;
- rejection and send-back require reason; delegation requires validity and audit;
- approval actions are idempotent and concurrency-safe;
- a posted transaction cannot return to an editable state without controlled reversal;
- escalation and overdue notifications are observable and retryable.

## Common transaction lifecycle

`DRAFT → SUBMITTED → IN_REVIEW → APPROVED → POSTED → CLOSED` with `REJECTED`, `SENT_BACK`, `CANCELLED`, and `REVERSED` branches where the domain permits.
