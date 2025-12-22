import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRoleToUsers1700000000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear el tipo enum si no existe
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM('user', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Agregar la columna role a la tabla users
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'role',
        type: 'enum',
        enum: ['user', 'admin'],
        default: "'user'",
        isNullable: false
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la columna role
    await queryRunner.dropColumn('users', 'role');

    // Eliminar el tipo enum
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum";`);
  }
}
