import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrendingIndexToMovies1700000000006 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear índice parcial para mejorar performance de queries filtradas por trending = true
    // Este índice solo incluye filas donde trending = true, optimizando búsquedas de películas trending
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_MOVIES_TRENDING_TRUE" 
      ON "movies" ("trending") 
      WHERE "trending" = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar el índice parcial
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_MOVIES_TRENDING_TRUE";
    `);
  }
}
