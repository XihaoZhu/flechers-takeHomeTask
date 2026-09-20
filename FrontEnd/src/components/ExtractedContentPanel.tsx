import type { ContentBlock, DocumentStatus } from '../types/documents'
import { Spinner } from './Spinner'

interface ExtractedContentPanelProps {
  blocks: ContentBlock[]
  error: string | null
  hasSelectedDocument: boolean
  hasNextPage: boolean
  hasPreviousPage: boolean
  isLoading: boolean
  onNextPage?: () => void
  onPreviousPage?: () => void
  pageLabel?: string
  status: DocumentStatus | null
}

export function ExtractedContentPanel({
  blocks,
  error,
  hasSelectedDocument,
  hasNextPage,
  hasPreviousPage,
  isLoading,
  onNextPage,
  onPreviousPage,
  pageLabel,
  status,
}: ExtractedContentPanelProps) {
  return (
    <section className="flex w-full min-w-0 flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:min-h-0">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-stone-950">Extracted content</h2>
          {status !== 'completed' ? (
            <p className="mt-1 text-sm text-stone-600">
              Text blocks are shown in source sequence once processing completes.
            </p>
          ) : null}
        </div>
        {pageLabel ? (
          <span className="w-fit shrink-0 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-800">
            {pageLabel}
          </span>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-6 flex min-w-0 items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 lg:flex-1">
          <Spinner />
          Loading extracted content...
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 min-w-0 break-words rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 lg:flex-1">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && status !== 'completed' ? (
        <div className="mt-6 min-w-0 break-words rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 lg:flex-1">
          {status === 'failed'
            ? 'No extracted content is available because processing failed.'
            : 'Extracted content will appear here after the document has completed processing.'}
        </div>
      ) : null}

      {!isLoading && !error && status === 'completed' && blocks.length === 0 ? (
        <div className="mt-6 min-w-0 break-words rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600 lg:flex-1">
          Processing completed, but no extracted text blocks were returned.
        </div>
      ) : null}

      {!isLoading && !error && blocks.length > 0 ? (
        <div className="mt-6 min-w-0 space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {blocks.map((block) => (
            <article
              key={block.id}
              className="w-full min-w-0 rounded-xl border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                <span className="shrink-0">Sequence {block.sequence}</span>
                {block.page_number !== null ? (
                  <span className="shrink-0">Page {block.page_number}</span>
                ) : null}
                <span className="min-w-0 max-w-full break-words rounded-full border border-stone-200 bg-white px-2 py-0.5 text-stone-700">
                  {block.extraction_method}
                </span>
              </div>
              <p className="mt-3 max-h-80 min-w-0 overflow-y-auto overflow-x-hidden whitespace-pre-wrap break-words rounded-lg bg-white p-3 text-sm leading-6 text-stone-800 ring-1 ring-inset ring-stone-200">
                {block.text}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex min-w-0 items-center justify-between gap-3 border-t border-stone-200 pt-4">
        <button
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-green-700 hover:text-green-800 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
          disabled={!hasSelectedDocument || !hasPreviousPage || isLoading || !onPreviousPage}
          onClick={onPreviousPage}
          type="button"
        >
          Previous
        </button>
        <button
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:border-green-700 hover:text-green-800 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
          disabled={!hasSelectedDocument || !hasNextPage || isLoading || !onNextPage}
          onClick={onNextPage}
          type="button"
        >
          Next
        </button>
      </div>
    </section>
  )
}
