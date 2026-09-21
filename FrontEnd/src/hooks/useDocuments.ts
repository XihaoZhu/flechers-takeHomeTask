import { useEffect, useState } from 'react'

import { getDocuments } from '../api/documents'
import type { Document } from '../types/documents'

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentsPageSize, setDocumentsPageSize] = useState(getDocumentsPageSize)
  const [documentsOffset, setDocumentsOffset] = useState(0)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentsError, setDocumentsError] = useState<string | null>(null)

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

  function updateDocumentInHistory(updatedDocument: Document) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === updatedDocument.id ? updatedDocument : document,
      ),
    )
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

  return {
    documents,
    documentsError,
    documentsLoading,
    documentsOffset,
    documentsPageSize,
    loadDocuments,
    refreshDocuments,
    updateDocumentInHistory,
  }
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
