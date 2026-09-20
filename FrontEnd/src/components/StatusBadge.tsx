import type { DocumentStatus } from '../types/documents'
import { Spinner } from './Spinner'

const statusStyles: Record<DocumentStatus, string> = {
  uploaded: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  processing: 'border-amber-200 bg-amber-50 text-amber-800',
  completed: 'border-green-200 bg-green-50 text-green-800',
  failed: 'border-red-200 bg-red-50 text-red-800',
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[status]}`}
    >
      {status === 'processing' ? <Spinner /> : null}
      {status}
    </span>
  )
}
