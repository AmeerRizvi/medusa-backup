import path from "path"
import os from "os"
import fs from "fs"
import { promisify } from "util"
import { exec } from "child_process"
import { createAndUploadBackup, extractDbConfig, extractZipFromUrl } from "../helper"
import { BACKUPS_MODULE } from "../../../../modules/backups"

const TEMP_DIR = os.tmpdir()
const execAsync = promisify(exec)

const PROD = process.env.NODE_ENV === "production"

export async function POST(req, res) {
  const service = req.scope.resolve(BACKUPS_MODULE)

  try {
    if (PROD) {
      const isAnyLoading = (await service.listBackups({ status: "loading" })).length > 0
      if (isAnyLoading) {
        return res.status(400).json({ error: "Backup is already in progress. Please wait." })
      }

      const { backupId } = await createAndUploadBackup(req.scope, "pre-restore")

      if (!backupId) {
        return res.status(400).json({ error: "Error occured trying to take a safe backup" })
      }
    }

    let { DB_BASE, DB_NAME } = extractDbConfig()

    const DB_ADMIN_URL = `${DB_BASE}/postgres`

    const { url } = JSON.parse(req.body)
    if (!url) return res.status(400).json({ error: "Backup URL is required" })

    const tempDir = path.join(TEMP_DIR, "restore")
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

    const backupFilePath = await extractZipFromUrl(url)
    const backupRecordsPath = path.join(tempDir, "backup_records.sql")
    const DB_URL = `${DB_BASE}/${DB_NAME}`

    let cmd = `pg_dump -d "${DB_URL}" -t db_backups -f "${backupRecordsPath}"`
    await execAsync(cmd)

    cmd = `psql "${DB_ADMIN_URL}" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}';"`
    await execAsync(cmd)

    cmd = `psql "${DB_ADMIN_URL}" -c "DROP DATABASE IF EXISTS \\"${DB_NAME}\\";"`
    await execAsync(cmd)

    cmd = `psql "${DB_ADMIN_URL}" -c "CREATE DATABASE \\"${DB_NAME}\\";"`
    await execAsync(cmd)

    cmd = `psql "${DB_URL}" -f "${backupFilePath}"`
    await execAsync(cmd)

    cmd = `psql "${DB_URL}" -c "DROP TABLE IF EXISTS db_backups;"`
    await execAsync(cmd)

    cmd = `psql "${DB_URL}" -f "${backupRecordsPath}"`
    await execAsync(cmd)

    fs.rmSync(tempDir, { recursive: true, force: true })

    res.status(200).json({
      message: `Database ${DB_NAME} has been reset, recreated, and restored successfully.`,
    })
  } catch (error: any) {
    res.status(500).json({
      message: "An error occurred during the restore process",
      error: error.message,
    })
  }
}
