import type { Document } from '../types/documents'
import { StatusBadge } from './StatusBadge'

export function DocumentStatusPanel({ document }: { document: Document | null }) {
  if (!document) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-950">Current document status</h2>
        <p className="mt-3 text-sm text-stone-600">
          Select a document from history or upload a new one to see its processing status.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Current document status</h2>
          <p className="mt-1 break-words text-sm font-medium text-stone-800">{document.filename}</p>
        </div>
        <StatusBadge status={document.status} />
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">File type</dt>
          <dd className="mt-1 text-sm font-medium uppercase text-stone-950">{document.file_type}</dd>
        </div>
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">Status</dt>
          <dd className="mt-1 text-sm font-medium capitalize text-stone-950">{document.status}</dd>
        </div>
      </dl>

      {document.status === 'failed' && document.error_message ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {document.error_message}
        </div>
      ) : null}
    </section>
  )
}
