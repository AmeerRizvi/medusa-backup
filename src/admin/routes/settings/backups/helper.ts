export type Backup = {
  id: string
  status: string
  created_at: string
  fileUrl?: string
  fileId?: string
  metadata?: {
    size?: number
    originalSize?: number
    note?: string
  }
}

export const getBackupSizeString = (size: number | null | undefined, originalSize: number | null | undefined) => {
  if (!size || !originalSize || originalSize === 0) return ""
  const formatSize = (bytes: number): string => {
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${Math.round(bytes / 1024)}KB`
  }
  return `${formatSize(size)} (~${formatSize(originalSize)})`
}

export const actionFetch = async () => {
  const response = await fetch("/admin/backup/db-backup", {
    method: "GET",
    credentials: "include",
  })
  return response
}

export const actionBackup = async () => {
  const response = await fetch("/admin/backup/db-backup", {
    method: "POST",
    credentials: "include",
  })
  return response
}

export const actionDelete = async (id: string | null) => {
  const response = await fetch(`/admin/backup/db-backup`, {
    method: "DELETE",
    credentials: "include",
    body: JSON.stringify({ id }),
  })
  return response
}

export const actionRestore = async (backupUrl: string | null) => {
  const response = await fetch("/admin/backup/db-restore", {
    method: "POST",
    body: JSON.stringify({ url: backupUrl }),
    credentials: "include",
  })
  return response
}

export const actionAuto = async () => {
  const response = await fetch("/admin/backup/auto-status", {
    method: "GET",
    credentials: "include",
  })
  return response
}

export const actionUpdateMetadata = async (id: string, metadata: Record<string, any>) => {
  const response = await fetch("/admin/backup/update-metadata", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ id, metadata }),
  })
  return response
}
