import { useState } from 'react'

import { getDocument, uploadDocument } from '../api/documents'
import {
  DOCX_BLOCKS_PAGE_SIZE,
  useDocumentProcessing,
} from './useDocumentProcessing'
import { useDocuments } from './useDocuments'

export { DOCX_BLOCKS_PAGE_SIZE }

export type SourcePanel = 'history' | 'upload'
export type MobilePanel = SourcePanel | 'current'

export function useDocumentDashboard() {
  const documentsState = useDocuments()
  const processingState = useDocumentProcessing({
    onDocumentPolled: documentsState.updateDocumentInHistory,
    refreshDocuments: documentsState.refreshDocuments,
  })

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [sourcePanel, setSourcePanel] = useState<SourcePanel>('upload')
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('upload')
  const [previousMobilePanel, setPreviousMobilePanel] = useState<SourcePanel>('upload')

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
      processingState.setUploadedDocument(latestDocument)
      setPreviousMobilePanel('upload')
      setMobilePanel('current')
      await documentsState.refreshDocuments(0)
      void processingState.pollDocument(uploadedDocument.id)
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  async function selectDocumentFromHistory(
    document: Parameters<typeof processingState.selectDocument>[0],
  ) {
    setPreviousMobilePanel('history')
    setMobilePanel('current')
    await processingState.selectDocument(document)
  }

  function changeMobilePanel(panel: SourcePanel) {
    setMobilePanel(panel)

    if (panel === 'upload') {
      processingState.clearCurrentDocument()
    }
  }

  function changeSourcePanel(panel: SourcePanel) {
    setSourcePanel(panel)

    if (panel === 'upload') {
      processingState.clearCurrentDocument()
    }
  }

  return {
    ...documentsState,
    ...processingState,
    changeMobilePanel,
    changeSourcePanel,
    handleUpload,
    isUploading,
    mobilePanel,
    previousMobilePanel,
    selectedFile,
    selectDocument: selectDocumentFromHistory,
    setMobilePanel,
    setSelectedFile,
    sourcePanel,
    uploadError,
  }
}
