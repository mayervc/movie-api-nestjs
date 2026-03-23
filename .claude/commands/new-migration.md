Generate and validate a TypeORM migration for this project.

## Steps

Given `$ARGUMENTS` (migration name, e.g. `AddStatusToMovies`):

1. **Check entity changes** — read the relevant entity file(s) to understand what columns/relations changed
2. **Generate migration**:
   ```bash
   npm run migration:generate -- src/migrations/$ARGUMENTS
   ```
3. **Review the generated file** — read it and verify:
   - `up()` adds the correct columns/constraints/indexes
   - `down()` correctly reverts every change in `up()`
   - Column names are snake_case
   - No `DROP` of existing data unless explicitly requested
4. **Apply and verify**:
   ```bash
   npm run migration:run
   ```

## Naming conventions

- Format: `PascalCase` describing the change — `AddStatusToMovies`, `CreateCinemaUsersTable`, `AddIndexToTrending`
- The timestamp prefix is added automatically by TypeORM

## Safety rules

- Never use `synchronize: true` — always use migrations
- `down()` must be a complete inverse of `up()`
- If dropping a column, warn the user that data will be lost and ask for confirmation
- If adding a `NOT NULL` column to an existing table, the migration must provide a default value or migrate existing rows first
- After `migration:run`, confirm by checking `SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 3;` to verify it was applied

## Rollback

If something goes wrong:
```bash
npm run migration:revert
```
