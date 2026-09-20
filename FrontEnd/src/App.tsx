import { useEffect, useState } from 'react'

import { DocumentStatusPanel } from './components/DocumentStatusPanel'
import { ExtractedContentPanel } from './components/ExtractedContentPanel'
import { Header } from './components/Header'
import { HistorySidebar } from './components/HistorySidebar'
import { UploadPanel } from './components/UploadPanel'
import { getDocument, getDocumentBlocks, getDocuments, uploadDocument } from './api/documents'
import type { ContentBlock, Document } from './types/documents'

const POLLING_INTERVAL_MS = 5000
const DOCX_BLOCKS_PAGE_SIZE = 5
const PDF_BLOCK_FETCH_SIZE = 50
type SourcePanel = 'history' | 'upload'
type MobilePanel = SourcePanel | 'current'

function App() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsPageSize, setDocumentsPageSize] = useState(getDocumentsPageSize)
  const [documentsOffset, setDocumentsOffset] = useState(0)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState<string | null>(null)

  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [blocksOffset, setBlocksOffset] = useState(0)
  const [pdfPageIndex, setPdfPageIndex] = useState(0)
  const [blocksLoading, setBlocksLoading] = useState(false)
  const [blocksError, setBlocksError] = useState<string | null>(null)
  const [sourcePanel, setSourcePanel] = useState<SourcePanel>('upload')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('upload')
  const [previousMobilePanel, setPreviousMobilePanel] = useState<SourcePanel>('upload')

  const isPdfSelected = selectedDocument?.file_type.toLowerCase() === 'pdf'
  const pdfPageNumbers = getPdfPageNumbers(contentBlocks)
  const visibleBlocks =
    isPdfSelected && pdfPageNumbers.length > 0
      ? contentBlocks.filter((block) => block.page_number === pdfPageNumbers[pdfPageIndex])
      : contentBlocks
  const hasPreviousContentPage = isPdfSelected ? pdfPageIndex > 0 : blocksOffset > 0
  const hasNextContentPage = isPdfSelected
    ? pdfPageIndex < pdfPageNumbers.length - 1
    : contentBlocks.length === DOCX_BLOCKS_PAGE_SIZE

  async function refreshDocuments(offset = documentsOffset) {
    const data = await getDocuments(offset, documentsPageSize)
    setDocumentsOffset(offset)
    setDocuments(data.documents)
    return data.documents
  }

  async function loadDocuments(offset = documentsOffset) {
    setDocumentsLoading(true)
    setDocumentsError(null)

    try {
      await refreshDocuments(offset)
    } catch (error) {
      setDocumentsError(error instanceof Error ? error.message : 'Failed to load documents')
    } finally {
      setDocumentsLoading(false)
    }
  }

  async function loadContentBlocks(document: Document, offset = blocksOffset) {
    setBlocksLoading(true)
    setBlocksError(null)

    try {
      if (document.file_type.toLowerCase() === 'pdf') {
        const allBlocks = await getAllDocumentBlocks(document.id)
        setBlocksOffset(0)
        setPdfPageIndex(0)
        setContentBlocks(allBlocks)
      } else {
        const data = await getDocumentBlocks(document.id, offset, DOCX_BLOCKS_PAGE_SIZE)
        setBlocksOffset(offset)
        setPdfPageIndex(0)
        setContentBlocks(data.blocks)
      }
    } catch (error) {
      setBlocksError(error instanceof Error ? error.message : 'Failed to load extracted content')
      setContentBlocks([])
    } finally {
      setBlocksLoading(false)
    }
  }

  async function selectDocument(document: Document) {
    setSelectedDocument(document)
    setContentBlocks([])
    setBlocksOffset(0)
    setPdfPageIndex(0)
    setBlocksError(null)
    setPreviousMobilePanel('history')
    setMobilePanel('current')

    try {
      const latestDocument = await getDocument(document.id)
      setSelectedDocument(latestDocument)

      if (latestDocument.status === 'completed') {
        await loadContentBlocks(latestDocument, 0)
      }
    } catch (error) {
      setBlocksError(error instanceof Error ? error.message : 'Failed to load document details')
    }
  }

  async function pollDocument(documentId: number) {
    const latestDocument = await getDocument(documentId)
    setSelectedDocument((currentDocument) =>
      currentDocument?.id === documentId ? latestDocument : currentDocument,
    )

    const latestDocuments = await refreshDocuments()
    const refreshedSelection = latestDocuments.find((document) => document.id === documentId)

    if (refreshedSelection) {
      setSelectedDocument(refreshedSelection)
    }

    if (latestDocument.status === 'completed') {
      await loadContentBlocks(latestDocument, 0)
      return
    }

    if (latestDocument.status === 'failed') {
      setContentBlocks([])
      return
    }

    window.setTimeout(() => {
      void pollDocument(documentId)
    }, POLLING_INTERVAL_MS)
  }

  async function handleUpload() {
    if (!selectedFile) {
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      const uploadedDocument = await uploadDocument(selectedFile)
      const latestDocument = await getDocument(uploadedDocument.id)

      setSelectedFile(null)
      setSelectedDocument(latestDocument)
      setContentBlocks([])
      setBlocksOffset(0)
      setPdfPageIndex(0)
      setPreviousMobilePanel('upload')
      setMobilePanel('current')
      await refreshDocuments(0)
      void pollDocument(uploadedDocument.id)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  function changeMobilePanel(panel: SourcePanel) {
    setMobilePanel(panel)

    if (panel === 'upload') {
      setSelectedDocument(null)
      setContentBlocks([])
      setBlocksOffset(0)
      setPdfPageIndex(0)
      setBlocksError(null)
    }
  }

  function changeSourcePanel(panel: SourcePanel) {
    setSourcePanel(panel)

    if (panel === 'upload') {
      setSelectedDocument(null)
      setContentBlocks([])
      setBlocksOffset(0)
      setPdfPageIndex(0)
      setBlocksError(null)
    }
  }

  useEffect(() => {
    getDocuments(0, documentsPageSize)
      .then((data) => {
        setDocuments(data.documents)
        setDocumentsOffset(0)
        setDocumentsError(null)
      })
      .catch((error) => {
        setDocumentsError(error instanceof Error ? error.message : 'Failed to load documents')
      })
      .finally(() => {
        setDocumentsLoading(false)
      })
  }, [documentsPageSize])

  useEffect(() => {
    function handleResize() {
      setDocumentsPageSize(getDocumentsPageSize())
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 text-stone-950">
      <Header />

      <main className="mx-auto hidden h-[calc(100vh-10.5rem)] min-h-[34rem] w-full max-w-7xl gap-6 overflow-hidden px-8 py-6 lg:grid lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col gap-4">
          <SourcePanelTabs activePanel={sourcePanel} onPanelChange={changeSourcePanel} />

          {sourcePanel === 'history' ? (
            <HistorySidebar
              currentOffset={documentsOffset}
              documents={documents}
              error={documentsError}
              isLoading={documentsLoading}
              onRefresh={() => void loadDocuments()}
              onNextPage={() => void loadDocuments(documentsOffset + documentsPageSize)}
              onPreviousPage={() =>
                void loadDocuments(Math.max(0, documentsOffset - documentsPageSize))
              }
              onSelectDocument={(document) => void selectDocument(document)}
              pageSize={documentsPageSize}
              selectedDocumentId={selectedDocument?.id ?? null}
            />
          ) : null}

          {sourcePanel === 'upload' ? (
            <UploadPanel
              error={uploadError}
              isUploading={isUploading}
              onFileSelect={setSelectedFile}
              onUpload={() => void handleUpload()}
              selectedFile={selectedFile}
            />
          ) : null}
        </section>

        <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
          <DocumentStatusPanel document={selectedDocument} />

          <ExtractedContentPanel
            blocks={visibleBlocks}
            error={blocksError}
            hasSelectedDocument={selectedDocument !== null}
            hasNextPage={hasNextContentPage}
            hasPreviousPage={hasPreviousContentPage}
            isLoading={blocksLoading}
            onNextPage={
              isPdfSelected
                ? () => setPdfPageIndex((currentIndex) => currentIndex + 1)
                : selectedDocument
                  ? () => void loadContentBlocks(selectedDocument, blocksOffset + DOCX_BLOCKS_PAGE_SIZE)
                  : undefined
            }
            onPreviousPage={
              isPdfSelected
                ? () => setPdfPageIndex((currentIndex) => Math.max(0, currentIndex - 1))
                : selectedDocument
                  ? () =>
                      void loadContentBlocks(
                        selectedDocument,
                        Math.max(0, blocksOffset - DOCX_BLOCKS_PAGE_SIZE),
                      )
                  : undefined
            }
            pageLabel={
              isPdfSelected && pdfPageNumbers.length > 0
                ? `PDF page ${pdfPageNumbers[pdfPageIndex] ?? 'unknown'}`
                : undefined
            }
            status={selectedDocument?.status ?? null}
          />
        </section>
      </main>

      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pb-8 sm:px-6 lg:hidden">
        {mobilePanel !== 'current' ? (
          <SourcePanelTabs activePanel={mobilePanel} onPanelChange={changeMobilePanel} />
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
            <button
              className="w-full rounded-xl bg-stone-50 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-green-50 hover:text-green-900"
              onClick={() => setMobilePanel(previousMobilePanel)}
              type="button"
            >
              Back to {previousMobilePanel === 'upload' ? 'Upload' : 'History'}
            </button>
          </div>
        )}

        <div className="mt-4">
          {mobilePanel === 'history' ? (
            <HistorySidebar
              currentOffset={documentsOffset}
              documents={documents}
              error={documentsError}
              isLoading={documentsLoading}
              onRefresh={() => void loadDocuments()}
              onNextPage={() => void loadDocuments(documentsOffset + documentsPageSize)}
              onPreviousPage={() =>
                void loadDocuments(Math.max(0, documentsOffset - documentsPageSize))
              }
              onSelectDocument={(document) => void selectDocument(document)}
              pageSize={documentsPageSize}
              selectedDocumentId={selectedDocument?.id ?? null}
            />
          ) : null}

          {mobilePanel === 'upload' ? (
            <UploadPanel
              error={uploadError}
              isUploading={isUploading}
              onFileSelect={setSelectedFile}
              onUpload={() => void handleUpload()}
              selectedFile={selectedFile}
            />
          ) : null}
        </div>

        {mobilePanel === 'current' ? (
          <section className="mt-4 space-y-6">
            <DocumentStatusPanel document={selectedDocument} />

            <ExtractedContentPanel
              blocks={visibleBlocks}
              error={blocksError}
              hasSelectedDocument={selectedDocument !== null}
              hasNextPage={hasNextContentPage}
              hasPreviousPage={hasPreviousContentPage}
              isLoading={blocksLoading}
              onNextPage={
                isPdfSelected
                  ? () => setPdfPageIndex((currentIndex) => currentIndex + 1)
                  : selectedDocument
                    ? () =>
                        void loadContentBlocks(
                          selectedDocument,
                          blocksOffset + DOCX_BLOCKS_PAGE_SIZE,
                        )
                    : undefined
              }
              onPreviousPage={
                isPdfSelected
                  ? () => setPdfPageIndex((currentIndex) => Math.max(0, currentIndex - 1))
                  : selectedDocument
                    ? () =>
                        void loadContentBlocks(
                          selectedDocument,
                          Math.max(0, blocksOffset - DOCX_BLOCKS_PAGE_SIZE),
                        )
                    : undefined
              }
              pageLabel={
                isPdfSelected && pdfPageNumbers.length > 0
                  ? `PDF page ${pdfPageNumbers[pdfPageIndex] ?? 'unknown'}`
                  : undefined
              }
              status={selectedDocument?.status ?? null}
            />
          </section>
        ) : null}
      </main>
    </div>
  )
}

async function getAllDocumentBlocks(documentId: number) {
  const blocks: ContentBlock[] = []
  let offset = 0

  while (true) {
    const data = await getDocumentBlocks(documentId, offset, PDF_BLOCK_FETCH_SIZE)
    blocks.push(...data.blocks)

    if (data.blocks.length < PDF_BLOCK_FETCH_SIZE) {
      return blocks
    }

    offset += PDF_BLOCK_FETCH_SIZE
  }
}

function getPdfPageNumbers(blocks: ContentBlock[]) {
  const pageNumbers: Array<number | null> = []

  for (const block of blocks) {
    if (!pageNumbers.includes(block.page_number)) {
      pageNumbers.push(block.page_number)
    }
  }

  return pageNumbers
}

function getDocumentsPageSize() {
  if (typeof window === 'undefined' || window.innerWidth < 1024) {
    return 8
  }

  const workspaceHeight = window.innerHeight - 168
  const fixedHistoryChrome = 260
  const documentItemHeight = 102
  const availableListHeight = workspaceHeight - fixedHistoryChrome

  return Math.max(3, Math.min(8, Math.floor(availableListHeight / documentItemHeight)))
}

interface SourcePanelTabsProps {
  activePanel: SourcePanel
  onPanelChange: (panel: SourcePanel) => void
}

function SourcePanelTabs({
  activePanel,
  onPanelChange,
}: SourcePanelTabsProps) {
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
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
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
