export function Header() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700">
          Fletchers document operations
        </p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Document Processing Pipeline
          </h1>
          <p className="mt-3 text-base leading-7 text-stone-600">
            Upload PDF and DOCX files, monitor processing status, and review extracted content in
            source order.
          </p>
        </div>
      </div>
    </header>
  )
}
