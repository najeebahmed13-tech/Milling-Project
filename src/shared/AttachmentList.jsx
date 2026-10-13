import { FileText } from "lucide-react";
import "./attachment-list.css";

export default function AttachmentList({ files = [], emptyLabel = "No file attached" }) {
  if (!files.length) {
    return (
      <div className="shared-attachment-empty" role="status">
        <span className="shared-attachment-empty-icon" aria-hidden="true">
          <FileText size={18} />
        </span>
        <span>{emptyLabel}</span>
      </div>
    );
  }

  return (
    <div className="shared-attachment-list">
      {files.map((file, index) => (
        <article
          className="shared-attachment-card"
          key={`${file.name}-${index}`}
        >
          {file.type?.startsWith("image/") ? (
            <img className="shared-attachment-preview" src={file.data} alt={file.name} />
          ) : (
            <div className="shared-attachment-file" aria-hidden="true">
              <FileText size={24} />
              <span>{file.type === "application/pdf" ? "PDF document" : "File"}</span>
            </div>
          )}
          <div className="shared-attachment-meta">
            <strong title={file.name}>{file.name}</strong>
            <a
              href={file.data}
              download={file.name}
              target="_blank"
              rel="noreferrer"
            >
              Open / download
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
