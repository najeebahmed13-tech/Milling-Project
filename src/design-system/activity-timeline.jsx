import React from "react";
import { DateRangeFilter } from "./date-range-filter.jsx";

function formatActivityDate(value) {
  if (!value) return "—";
  const [year, month, day] = String(value).slice(0, 10).split("-");
  return year && month && day ? `${day}-${month}-${year}` : value;
}

export function ActivityTimeline({
  activities = [],
  title = "Activities",
  description,
  reference,
}) {
  const ordered = [...activities].sort((left, right) =>
    String(right.date || "").localeCompare(String(left.date || "")),
  );
  const grouped = ordered.reduce((groups, activity) => {
    const key = activity.date || "unknown";
    groups[key] = groups[key] || [];
    groups[key].push(activity);
    return groups;
  }, {});

  return (
    <div className="sales-contract-activity-panel">
      <div className="sales-contract-activity-toolbar">
        <div>
          <h2>{title}</h2>
          <p>{description || `Audit trail for ${reference || "this record"}`}</p>
        </div>
        <div className="sales-contract-activity-filters">
          <DateRangeFilter
            start={formatActivityDate(ordered[ordered.length - 1]?.date)}
            end={formatActivityDate(ordered[0]?.date)}
          />
        </div>
      </div>
      <div className="sales-contract-activity-timeline">
        {Object.entries(grouped).map(([date, items]) => (
          <section className="sales-contract-activity-day" key={date}>
            <div className="sales-contract-activity-date">
              <span>{formatActivityDate(date)}</span>
            </div>
            <div className="sales-contract-activity-events">
              {items.map((activity, index) => (
                <article className="sales-contract-activity-event" key={`${date}-${activity.action}-${index}`}>
                  <time>{activity.time || "—"}</time>
                  <span className={`sales-contract-activity-marker ${activity.tone || "updated"}`} aria-hidden="true"><i /></span>
                  <div className="sales-contract-activity-card">
                    <p><strong>{activity.user || "System User"}</strong> <span>({activity.role || "User"})</span> {activity.action}.</p>
                    <small>{activity.detail}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
