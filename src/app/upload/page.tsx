 'use client'
import { useState } from 'react'
import { upload } from '@vercel/blob/client'

export const useImageUploader = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null)

  const handleImageUpload = async (file: File): Promise<string> => {
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setUploadingFileName(file.name)
    setIsUploading(true)

    try {
      const sanitizedFile = new File([file], file.name.replace(/[^a-z0-9.\-]/gi, ''), { type: file.type })

      const result = await upload(sanitizedFile.name, sanitizedFile, {
        access: 'public',
        handleUploadUrl: '/api/avatar/upload',
      })

      await new Promise(resolve => setTimeout(resolve, 1000))

      setUploadedUrl(result.url)
      return result.url
    } finally {
      setIsUploading(false)
      setUploadingFileName(null)
    }
  }

  const clearPreview = () => {
    setPreviewUrl(null)
    setUploadedUrl(null)
  }

  return { previewUrl, uploadedUrl, handleImageUpload, clearPreview, isUploading, uploadingFileName }
}
