# Integration Requirements

| Integration | Direction | Minimum requirements |
|---|---|---|
| Weighbridge | inbound/outbound | ticket identity, gross/tare/net, device time, retry, duplicate detection, offline buffer, reconciliation |
| Laboratory | inbound/outbound | sample/result identifiers, parameter/method version, attachments, hold/release, retry |
| SCADA/PLC/OEM | inbound | equipment state, counters, alarms, timestamp quality, buffering, monitoring |
| Sensors/IoT | inbound | device identity, unit, calibration, timestamp, threshold event, retention |
| Accounting/ERP | bidirectional | contracts/invoices/payments, mapping, idempotency, reconciliation, error queue |
| Logistics/carrier | bidirectional | vehicle, loading, delivery, POD, notification, authorization |
| Email/SMS | outbound | templates, recipient policy, provider abstraction, retry, delivery status |
| Object storage | bidirectional | private files, checksum, malware scan, retention, signed download |

Every adapter must define contract version, authentication, payload, correlation ID, idempotency key, retry/backoff, dead-letter or failure state, monitoring metric, and reconciliation procedure. External integrations must not bypass domain application services.
