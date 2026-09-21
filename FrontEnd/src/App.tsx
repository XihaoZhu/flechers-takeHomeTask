import { DocumentStatusPanel } from './components/DocumentStatusPanel'
import { ExtractedContentPanel } from './components/ExtractedContentPanel'
import { Header } from './components/Header'
import { HistorySidebar } from './components/HistorySidebar'
import { UploadPanel } from './components/UploadPanel'
import {
  DOCX_BLOCKS_PAGE_SIZE,
  type SourcePanel,
  useDocumentDashboard,
} from './hooks/useDocumentDashboard'


// Not really a complex project so the front end is just a one page application
// Components are encapsulated under folder components
// most logic are under folder hooks and are seperated into three big catagories based on purpose it serves
function App() {
  const dashboard = useDocumentDashboard()

  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 text-stone-950">
      <Header />

      <main className="mx-auto hidden h-[calc(100vh-10.5rem)] min-h-[34rem] w-full max-w-7xl gap-6 overflow-hidden px-8 py-6 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col gap-4">
          <SourcePanelTabs
            activePanel={dashboard.sourcePanel}
            onPanelChange={dashboard.changeSourcePanel}
          />

          {dashboard.sourcePanel === 'history' ? (
            <HistorySidebar
              currentOffset={dashboard.documentsOffset}
              documents={dashboard.documents}
              error={dashboard.documentsError}
              isLoading={dashboard.documentsLoading}
              onRefresh={() => void dashboard.loadDocuments()}
              onNextPage={() =>
                void dashboard.loadDocuments(
                  dashboard.documentsOffset + dashboard.documentsPageSize,
                )
              }
              onPreviousPage={() =>
                void dashboard.loadDocuments(
                  Math.max(0, dashboard.documentsOffset - dashboard.documentsPageSize),
                )
              }
              onSelectDocument={(document) => void dashboard.selectDocument(document)}
              pageSize={dashboard.documentsPageSize}
              selectedDocumentId={dashboard.selectedDocument?.id ?? null}
            />
          ) : null}

          {dashboard.sourcePanel === 'upload' ? (
            <UploadPanel
              error={dashboard.uploadError}
              isUploading={dashboard.isUploading}
              onFileSelect={dashboard.setSelectedFile}
              onUpload={() => void dashboard.handleUpload()}
              selectedFile={dashboard.selectedFile}
            />
          ) : null}
        </section>

        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
          <DocumentStatusPanel document={dashboard.selectedDocument} />

          <ExtractedContentPanel
            blocks={dashboard.visibleBlocks}
            error={dashboard.blocksError}
            fileType={dashboard.selectedDocument?.file_type ?? null}
            hasSelectedDocument={dashboard.selectedDocument !== null}
            hasNextPage={dashboard.hasNextContentPage}
            hasPreviousPage={dashboard.hasPreviousContentPage}
            isLoading={dashboard.blocksLoading}
            onNextPage={
              dashboard.isPdfSelected
                ? () => dashboard.setPdfPageIndex((currentIndex) => currentIndex + 1)
                : dashboard.selectedDocument
                  ? () =>
                    void dashboard.loadContentBlocks(
                      dashboard.selectedDocument!,
                      dashboard.blocksOffset + DOCX_BLOCKS_PAGE_SIZE,
                    )
                  : undefined
            }
            onPreviousPage={
              dashboard.isPdfSelected
                ? () =>
                  dashboard.setPdfPageIndex((currentIndex) => Math.max(0, currentIndex - 1))
                : dashboard.selectedDocument
                  ? () =>
                    void dashboard.loadContentBlocks(
                      dashboard.selectedDocument!,
                      Math.max(0, dashboard.blocksOffset - DOCX_BLOCKS_PAGE_SIZE),
                    )
                  : undefined
            }
            pageLabel={
              dashboard.isPdfSelected && dashboard.pdfPageNumbers.length > 0
                ? `PDF page ${dashboard.pdfPageNumbers[dashboard.pdfPageIndex] ?? 'unknown'}`
                : undefined
            }
            status={dashboard.selectedDocument?.status ?? null}
          />
        </section>
      </main>

      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pb-8 sm:px-6 lg:hidden">
        {dashboard.mobilePanel !== 'current' ? (
          <SourcePanelTabs
            activePanel={dashboard.mobilePanel}
            onPanelChange={dashboard.changeMobilePanel}
          />
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
            <button
              className="w-full rounded-xl bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-green-50 hover:text-green-900"
              onClick={() => dashboard.setMobilePanel(dashboard.previousMobilePanel)}
              type="button"
            >
              Back to {dashboard.previousMobilePanel === 'upload' ? 'Upload' : 'History'}
            </button>
          </div>
        )}

        <div className="mt-4">
          {dashboard.mobilePanel === 'history' ? (
            <HistorySidebar
              currentOffset={dashboard.documentsOffset}
              documents={dashboard.documents}
              error={dashboard.documentsError}
              isLoading={dashboard.documentsLoading}
              onRefresh={() => void dashboard.loadDocuments()}
              onNextPage={() =>
                void dashboard.loadDocuments(
                  dashboard.documentsOffset + dashboard.documentsPageSize,
                )
              }
              onPreviousPage={() =>
                void dashboard.loadDocuments(
                  Math.max(0, dashboard.documentsOffset - dashboard.documentsPageSize),
                )
              }
              onSelectDocument={(document) => void dashboard.selectDocument(document)}
              pageSize={dashboard.documentsPageSize}
              selectedDocumentId={dashboard.selectedDocument?.id ?? null}
            />
          ) : null}

          {dashboard.mobilePanel === 'upload' ? (
            <UploadPanel
              error={dashboard.uploadError}
              isUploading={dashboard.isUploading}
              onFileSelect={dashboard.setSelectedFile}
              onUpload={() => void dashboard.handleUpload()}
              selectedFile={dashboard.selectedFile}
            />
          ) : null}
        </div>

        {dashboard.mobilePanel === 'current' ? (
          <section className="mt-4 space-y-6">
            <DocumentStatusPanel document={dashboard.selectedDocument} />

            <ExtractedContentPanel
              blocks={dashboard.visibleBlocks}
              error={dashboard.blocksError}
              fileType={dashboard.selectedDocument?.file_type ?? null}
              hasSelectedDocument={dashboard.selectedDocument !== null}
              hasNextPage={dashboard.hasNextContentPage}
              hasPreviousPage={dashboard.hasPreviousContentPage}
              isLoading={dashboard.blocksLoading}
              onNextPage={
                dashboard.isPdfSelected
                  ? () => dashboard.setPdfPageIndex((currentIndex) => currentIndex + 1)
                  : dashboard.selectedDocument
                    ? () =>
                      void dashboard.loadContentBlocks(
                        dashboard.selectedDocument!,
                        dashboard.blocksOffset + DOCX_BLOCKS_PAGE_SIZE,
                      )
                    : undefined
              }
              onPreviousPage={
                dashboard.isPdfSelected
                  ? () =>
                    dashboard.setPdfPageIndex((currentIndex) => Math.max(0, currentIndex - 1))
                  : dashboard.selectedDocument
                    ? () =>
                      void dashboard.loadContentBlocks(
                        dashboard.selectedDocument!,
                        Math.max(0, dashboard.blocksOffset - DOCX_BLOCKS_PAGE_SIZE),
                      )
                    : undefined
              }
              pageLabel={
                dashboard.isPdfSelected && dashboard.pdfPageNumbers.length > 0
                  ? `PDF page ${dashboard.pdfPageNumbers[dashboard.pdfPageIndex] ?? 'unknown'}`
                  : undefined
              }
              status={dashboard.selectedDocument?.status ?? null}
            />
          </section>
        ) : null}
      </main>
    </div>
  )
}

interface SourcePanelTabsProps {
  activePanel: SourcePanel
  onPanelChange: (panel: SourcePanel) => void
}

function SourcePanelTabs({ activePanel, onPanelChange }: SourcePanelTabsProps) {
  const tabs: Array<{ label: string; panel: SourcePanel }> = [
    { label: 'Upload', panel: 'upload' },
    { label: 'History', panel: 'history' },
  ]

  return (
    <nav
      aria-label="Document source"
      className="grid grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm"
    >
      {tabs.map((tab) => {
        const isActive = activePanel === tab.panel

        return (
          <button
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive
              ? 'bg-green-800 text-white shadow-sm'
              : 'bg-stone-50 text-stone-700 hover:bg-green-50 hover:text-green-900'
              }`}
            key={tab.panel}
            onClick={() => onPanelChange(tab.panel)}
            type="button"
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}

export default App
