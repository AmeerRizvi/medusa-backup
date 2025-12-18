import fetch from "node-fetch"
import * as unzipper from "unzipper"
import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import { Readable } from "stream"
import { execSync } from "child_process"
import { uploadFilesWorkflow } from "@medusajs/medusa/core-flows"
import { BACKUPS_MODULE } from "../../../modules/backups"

const TEMP_DIR = os.tmpdir()

export async function extractZipFromUrl(url: string): Promise<string> {
  const decodedUrl = decodeURIComponent(url)
  const tempDir = path.join(TEMP_DIR, "restore")
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
  const response = await fetch(decodedUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch ZIP: ${response.status} ${response.statusText}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.readUInt32LE(0) !== 0x04034b50) {
    throw new Error("Downloaded file is not a valid ZIP archive")
  }
  await new Promise((resolve, reject) => {
    Readable.from(buffer)
      .pipe(unzipper.Extract({ path: tempDir }))
      .on("close", resolve)
      .on("error", reject)
  })
  const sqlFile = fs.readdirSync(tempDir).find((f) => f.endsWith(".sql"))
  if (!sqlFile) {
    throw new Error("No SQL file found in extracted ZIP")
  }
  return path.join(tempDir, sqlFile)
}

export async function createBackupZip(dir: string, file: string) {
  const timestamp = new Date().toISOString().replace(/[:.-]/g, "_")
  const zipFileName = `db_backup_${timestamp}.zip`
  const zipFilePath = path.join(dir, zipFileName)
  execSync(`zip -j "${zipFilePath}" "${file}"`)
  return { zipFileName, zipFilePath }
}

export function extractDbConfig() {
  const DATABASE_URL = process.env.DATABASE_URL ?? ""
  const parts = DATABASE_URL.split("/")
  let DB_NAME = parts.pop()
  let DB_BASE = parts.join("/")
  DB_BASE = process.env.DB_BASE ?? DB_BASE
  DB_NAME = process.env.DB_NAME ?? DB_NAME
  return { DB_BASE, DB_NAME }
}

export async function createAndUploadBackup(scope: any, type?: any) {
  let { DB_BASE, DB_NAME } = extractDbConfig()

  const TEMP_DIR = os.tmpdir()
  const BACKUP_FILE = path.join(TEMP_DIR, "db_backup.sql")

  const service = scope.resolve(BACKUPS_MODULE)
  const newBackup = await service.createBackups({ status: "loading" })
  if (!newBackup?.id) throw new Error("Failed to create a new backup entry")

  const backupId = newBackup.id
  const DB_URL = `${DB_BASE}/${DB_NAME}`
  const cmd = `pg_dump -d "${DB_URL}" -f "${BACKUP_FILE}" --exclude-table-data=workflow_execution`

  execSync(cmd)

  if (!fs.existsSync(BACKUP_FILE)) throw new Error("Backup file not found!")

  const { zipFileName, zipFilePath } = await createBackupZip(TEMP_DIR, BACKUP_FILE)
  const fileBuffer = fs.readFileSync(zipFilePath)

  const { result } = await uploadFilesWorkflow(scope).run({
    input: {
      files: [
        {
          filename: zipFileName,
          content: fileBuffer.toString("base64"),
          mimeType: "application/zip",
          access: "private",
        },
      ],
    },
  })

  const fileId = result?.[0]?.id || ""
  const fileUrl = result?.[0]?.url || ""
  if (!fileId) throw new Error("Failed to upload backup to S3")

  const originalSize = fs.statSync(BACKUP_FILE).size
  const zipSize = fs.statSync(zipFilePath).size

  await service.updateBackups({
    id: backupId,
    fileId: fileId,
    fileUrl: fileUrl,
    status: "success",
    metadata: {
      size: zipSize,
      originalSize: originalSize,
      type: type,
    },
  })

  fs.unlinkSync(BACKUP_FILE)
  fs.unlinkSync(zipFilePath)

  return { backupId, fileId, fileUrl }
}
