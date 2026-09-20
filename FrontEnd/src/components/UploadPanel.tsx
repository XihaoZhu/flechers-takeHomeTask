import type { ChangeEvent, DragEvent } from 'react'

import { Spinner } from './Spinner'

interface UploadPanelProps {
  error: string | null
  isUploading: boolean
  onFileSelect: (file: File | null) => void
  onUpload: () => void
  selectedFile: File | null
}

export function UploadPanel({
  error,
  isUploading,
  onFileSelect,
  onUpload,
  selectedFile,
}: UploadPanelProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    onFileSelect(event.target.files?.[0] ?? null)
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    onFileSelect(event.dataTransfer.files[0] ?? null)
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-950">Upload document</h2>
          <p className="mt-1 text-sm text-stone-600">Choose a PDF or DOCX file to process.</p>
        </div>

        <button
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-stone-300"
          disabled={!selectedFile || isUploading}
          onClick={onUpload}
          type="button"
        >
          {isUploading ? <Spinner /> : null}
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <label
        className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-green-300 bg-green-50/40 px-4 py-8 text-center transition hover:border-green-700 hover:bg-green-50"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <span className="text-sm font-semibold text-green-900">Drop a file here or browse</span>
        <span className="mt-1 text-xs text-stone-500">Supported formats: .pdf and .docx</span>
        <input
          accept=".pdf,.docx"
          className="sr-only"
          disabled={isUploading}
          onChange={handleFileChange}
          type="file"
        />
      </label>

      <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
        {selectedFile ? (
          <span>
            Selected file: <span className="font-medium text-stone-950">{selectedFile.name}</span>
          </span>
        ) : (
          <span>No file selected yet.</span>
        )}
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
    </section>
  )
}
