import React from "react";

export function DetailSection({ title, description, status, children, className = "" }) {
  return (
    <section className={`ds-detail-section ${className}`.trim()}>
      <div className="ds-detail-section-heading">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
        {status}
      </div>
      {children}
    </section>
  );
}
