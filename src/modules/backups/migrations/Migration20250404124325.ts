import { Migration } from '@mikro-orm/migrations';

export class Migration20250404124325 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "db_backups" ("id" text not null, "fileId" text null, "fileUrl" text null, "status" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "db_backups_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_db_backups_deleted_at" ON "db_backups" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "db_backups" cascade;`);
  }

}
