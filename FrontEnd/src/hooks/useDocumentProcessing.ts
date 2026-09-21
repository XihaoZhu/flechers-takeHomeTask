import { useRef, useState } from 'react'

import { getDocument, getDocumentBlocks } from '../api/documents'
import type { ContentBlock, Document } from '../types/documents'

const POLLING_INTERVAL_MS = 2000
export const DOCX_BLOCKS_PAGE_SIZE = 5
const PDF_BLOCK_FETCH_SIZE = 50

interface UseDocumentProcessingOptions {
  onDocumentPolled: (document: Document) => void
  refreshDocuments: (offset?: number) => Promise<Document[]>
}

export function useDocumentProcessing({
  onDocumentPolled,
  refreshDocuments,
}: UseDocumentProcessingOptions) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([])
  const [blocksOffset, setBlocksOffset] = useState(0)
  const [docxHasNextPage, setDocxHasNextPage] = useState(false)
  const [pdfPageIndex, setPdfPageIndex] = useState(0)
  const [blocksLoading, setBlocksLoading] = useState(false)
  const [blocksError, setBlocksError] = useState<string | null>(null)

  const selectedDocumentRef = useRef<Document | null>(null)

  selectedDocumentRef.current = selectedDocument

  const isPdfSelected = selectedDocument?.file_type.toLowerCase() === 'pdf'
  const pdfPageNumbers = getPdfPageNumbers(contentBlocks)
  const visibleBlocks =
    isPdfSelected && pdfPageNumbers.length > 0
      ? contentBlocks.filter((block) => block.page_number === pdfPageNumbers[pdfPageIndex])
      : contentBlocks
  const hasPreviousContentPage = isPdfSelected ? pdfPageIndex > 0 : blocksOffset > 0
  const hasNextContentPage = isPdfSelected
    ? pdfPageIndex < pdfPageNumbers.length - 1
    : docxHasNextPage

  async function loadContentBlocks(document: Document, offset = blocksOffset) {
    setBlocksLoading(true)
    setBlocksError(null)

    try {
      if (document.file_type.toLowerCase() === 'pdf') {
        const allBlocks = await getAllDocumentBlocks(document.id)
        setBlocksOffset(0)
        setDocxHasNextPage(false)
        setPdfPageIndex(0)
        setContentBlocks(allBlocks)
      } else {
        const data = await getDocumentBlocks(document.id, offset, DOCX_BLOCKS_PAGE_SIZE + 1)
        setBlocksOffset(offset)
        setDocxHasNextPage(data.blocks.length > DOCX_BLOCKS_PAGE_SIZE)
        setPdfPageIndex(0)
        setContentBlocks(data.blocks.slice(0, DOCX_BLOCKS_PAGE_SIZE))
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
    resetContentState()
    setBlocksError(null)

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
    onDocumentPolled(latestDocument)

    await refreshDocuments()

    const isStillSelected = selectedDocumentRef.current?.id === documentId

    if (isStillSelected) {
      setSelectedDocument(latestDocument)
    }

    if (latestDocument.status === 'completed') {
      if (isStillSelected) {
        await loadContentBlocks(latestDocument, 0)
      }
      return
    }

    if (latestDocument.status === 'failed') {
      if (isStillSelected) {
        setContentBlocks([])
      }
      return
    }

    window.setTimeout(() => {
      void pollDocument(documentId)
    }, POLLING_INTERVAL_MS)
  }

  function setUploadedDocument(document: Document) {
    setSelectedDocument(document)
    resetContentState()
  }

  function clearCurrentDocument() {
    setSelectedDocument(null)
    resetContentState()
    setBlocksError(null)
  }

  function resetContentState() {
    setContentBlocks([])
    setBlocksOffset(0)
    setDocxHasNextPage(false)
    setPdfPageIndex(0)
  }

  return {
    blocksError,
    blocksLoading,
    blocksOffset,
    clearCurrentDocument,
    hasNextContentPage,
    hasPreviousContentPage,
    isPdfSelected,
    loadContentBlocks,
    pdfPageIndex,
    pdfPageNumbers,
    pollDocument,
    selectedDocument,
    selectDocument,
    setPdfPageIndex,
    setUploadedDocument,
    visibleBlocks,
  }
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
