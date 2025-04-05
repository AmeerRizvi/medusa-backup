<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/AmeerRizvi/medusa-backup/v2/metadata/icon_medusa_backup.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/AmeerRizvi/medusa-backup/v2/metadata/icon_medusa_backup.svg">
    <img alt="Medusa logo" src="https://raw.githubusercontent.com/AmeerRizvi/medusa-backup/v2/metadata/icon_medusa_backup.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa Backup
</h1>

<p align="center">
  DB Backups for Medusa v2
</p>

A lightweight database backup solution for Medusa.js v2. Now you can create, manage, and restore database backups for PostgreSQL

Compatible with versions >= 2.4.0 of `@medusajs/medusa`. Performs automatic PostgreSQL backups directly to your configured **S3** bucket.

## Install

    npm i medusa-backup

Then add it to your `medusa.config.ts`:

```ts
module.exports = defineConfig({
  ...,
  plugins: [
    {
      resolve: "medusa-backup",
      options: {},
    },
  ],
})
```

### S3 Configuration

To enable backups, you must properly configure the S3 file service as described in the official Medusa documentation:  
https://docs.medusajs.com/resources/architectural-modules/file/s3#content

Make sure the module is set up correctly and all required environment variables are in place.

### Known Issues

Medusa.js <2.6.1 have route issues where admin routes do not show up in production.  
As a temporary fix, run:

    curl -L https://github.com/AmeerRizvi/medusa-backup/archive/refs/heads/v2.zip -o backup.zip
    unzip backup.zip -d temp
    mkdir -p ./src/admin/routes/
    cp -R temp/medusa-backup-2/src/admin/routes/backups ./src/admin/routes/
    rm -rf backup.zip temp

Or update to the latest Medusa version (>2.6.1).

## Automatic Backups

To enable automatic backups, add this to your project's `.env` file (disabled by default):

    DB_BACKUP_AUTO=true

Automatic backup is scheduled to run every day at 1 AM by default.  
To customize the schedule, add a cron-formatted value:

    DB_BACKUP_SCHEDULE="0 1 * * *"

For more information on cron formatting, [see this guide](https://crontab.guru/).

## Usage

The plugin is pretty straightforward.  
Click below to watch the quick walkthrough:

https://raw.githubusercontent.com/AmeerRizvi/medusa-backup/v2/metadata/ref_medusa_backup_1.mp4

## Notes

- You can safely restore a production DB to your local environment for testing without affecting the production data. Copy the URL from backup entry and restore using URL

![image](https://raw.githubusercontent.com/AmeerRizvi/medusa-backup/v2/metadata/sc1.png)
![image](https://raw.githubusercontent.com/AmeerRizvi/medusa-backup/v2/metadata/sc2.png)

- Backup files are compressed, reducing their size by approximately ~**70%**.

![image](https://raw.githubusercontent.com/AmeerRizvi/medusa-backup/v2/metadata/sc3.png)

- PostgreSQL version should match `pg_dump` and `psql` for compatibility.
- Plugin has been stress tested on the latest versions of `psql`

#### Need any help?

[Drop me a message](https://ameerrizvi.xyz) if you need anything, happy to help out :)
