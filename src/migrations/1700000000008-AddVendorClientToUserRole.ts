import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVendorClientToUserRole1700000000008
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extend the existing Postgres enum type "user_role_enum"
    // Values originally created by 1700000000005-AddRoleToUsers.ts
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'vendor'
            AND enumtypid = 'user_role_enum'::regtype
        ) THEN
          ALTER TYPE "user_role_enum" ADD VALUE 'vendor';
        END IF;

        IF NOT EXISTS (
          SELECT 1
          FROM pg_enum
          WHERE enumlabel = 'client'
            AND enumtypid = 'user_role_enum'::regtype
        ) THEN
          ALTER TYPE "user_role_enum" ADD VALUE 'client';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // Postgres doesn't support removing enum values easily.
    // Keeping down() as a no-op is acceptable for this migration.
  }
}

