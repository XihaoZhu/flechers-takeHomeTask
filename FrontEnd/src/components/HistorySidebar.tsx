import type { Document } from '../types/documents'
import { formatDateTime } from '../utils/formatDateTime'
import { StatusBadge } from './StatusBadge'

interface HistorySidebarProps {
  currentOffset: number
  documents: Document[]
  error: string | null
  isLoading: boolean
  onNextPage: () => void
  onPreviousPage: () => void
  onRefresh: () => void
  onSelectDocument: (document: Document) => void
  pageSize: number
  selectedDocumentId: number | null
}

export function HistorySidebar({
  currentOffset,
  documents,
  error,
  isLoading,
  onNextPage,
  onPreviousPage,
  onRefresh,
  onSelectDocument,
  pageSize,
  selectedDocumentId,
}: HistorySidebarProps) {
  const hasPreviousPage = currentOffset > 0
  const hasNextPage = documents.length === pageSize

  return (
    <aside className="flex w-full min-w-0 flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:min-h-0 lg:flex-1">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-stone-950">Document history</h2>
          <p className="mt-1 text-sm text-stone-600">Newest documents appear first.</p>
        </div>
        <button
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-green-700 hover:text-green-800"
          onClick={onRefresh}
          type="button"
        >
          Refresh
        </button>
      </div>

      {isLoading ? <p className="mt-5 text-sm text-stone-600">Loading documents...</p> : null}

      {error ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && documents.length === 0 ? (
        <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          No documents have been uploaded yet.
        </div>
      ) : null}

      {!error && documents.length > 0 ? (
        <div className="mt-5 min-w-0 space-y-3 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          {documents.map((document) => {
            const isSelected = document.id === selectedDocumentId

            return (
              <button
                className={`w-full rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-green-700 bg-green-50 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-green-300 hover:bg-stone-50'
                }`}
                key={document.id}
                onClick={() => onSelectDocument(document)}
                type="button"
              >
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-stone-950">{document.filename}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
                      {document.file_type}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={document.status} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-stone-500">{formatDateTime(document.created_at)}</p>
              </button>
            )
          })}
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-200 pt-4">
        <button
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-green-700 hover:text-green-800 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
          disabled={!hasPreviousPage || isLoading}
          onClick={onPreviousPage}
          type="button"
        >
          Previous
        </button>
        <button
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-green-700 hover:text-green-800 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
          disabled={!hasNextPage || isLoading}
          onClick={onNextPage}
          type="button"
        >
          Next
        </button>
      </div>
    </aside>
  )
}
