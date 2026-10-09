# Dispatch Flow Benchmark

This document is the benchmark workflow for outbound dispatch. Dispatch implementations, state transitions, permissions, validations, audit events, and documents should align with this sequence while remaining configurable by tenant, company, mill, product, and regulatory context.

```text
CUSTOMER / SALES DELIVERY REQUIREMENT
            │
            ▼
[01] Create  Delivery Request [customer, contract, location, delivery date, delivery type(self pick, company delivery]]

            │
            ▼
[01] Create Loading Instruction
     ├── Product
     ├── Quantity
     ├── Source Tank / Silo
     └── Loading Bay
            │
            ▼

[02] Map Transporter (email notification to Transporter) (conditional)
            │
            ▼
[03] Vehicle Arrives at Mill Gate show qr in email then vehicle & driver registration & direction as per loading instructions
            │
            ▼
[04] FIRST WEIGHMENT — EMPTY VEHICLE
     Tare Weight Captured
            │
            ▼
[05] Pre-Loading Checklist & Inspection
            │
            ▼

[06] Vehicle Moves to Loading Bay
            │
            ▼
[07] Loading Starts
            │
            ▼
[08] Loading Completes
            │
            ├──────────────┐
            ▼              ▼
[09] Sample Collection   Loading Record
            │
            ▼
[10] Laboratory Testing
     CPO: FFA / M&I / DOBI etc.
     PK: configurable PK specification
            │
            ▼
[11] Quality Result Data Entry & upload 
			│            
            ▼
[12] Seal Vehicle / Record Seal Numbers 
            │
            ▼
[13] Outbound Dispatch Checklist
            │
            ▼
[14] SECOND WEIGHMENT — LOADED
     Gross Weight Captured
            │
            ▼
     Net = Gross - Tare (weighbrigde ticket update)
            │
            ▼
[15] Planned vs Actual Validation
            │
       Variance Calculation in % & MT
			
            │
            ▼
[16] Generate Dispatch Documents
     ├── Delivery Note & Quality Certificate / Receipt (email and print) configurable
     ├── Waybill
     ├── 
     └── 
            │
            ▼
[17] Vehicle Leaves Mill
            │
            ▼
[18]    DISPATCHED
            │
            ▼
[19]  Optional downstream:
     Customer Receipt / POD
	 
			│
            ▼
[20] Entry of outbound fall into the Customer Details page >> 
     

			│
            ▼
[21]  Auto Sales Invoice Draft created
     
			│
            ▼
[22]  Entry in the AR report under Finance created once sales invoice status changaes to submitted
```

## Benchmark controls

- Each numbered step must have an explicit state, responsible role, timestamp, actor, and audit event.
- Weighbridge records are authoritative for tare, gross, and net calculations; net weight is calculated as `gross - tare`.
- Loading instructions must retain product, planned quantity, source tank or silo, and loading bay references.
- Laboratory specifications and tolerances are configurable master data and must be versioned when historical interpretation matters.
- Quality release is a server-enforced gate. A failed result must route to a configured hold, rework, QA approval, or rejection path.
- Planned-versus-actual validation must use configured product and delivery tolerances. Variances require an approval record before dispatch can continue.
- Seal numbers and generated documents must remain traceable to the dispatch, vehicle, weighments, quality result, and delivery request.
- Gate-out authorization must be denied until all required checklist, quality, variance, seal, and document controls are complete.
- The optional customer receipt or proof-of-delivery process is downstream of the `DISPATCHED` state.

## Minimum dispatch record links

The dispatch aggregate should link to the customer delivery requirement, transporter and vehicle, inspection, empty and loaded weighments, loading instruction and records, source storage unit, sample and laboratory results, QA release, variance approval, seal records, generated documents, gate-out authorization, and optional POD.
