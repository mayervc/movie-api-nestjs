## Jira

- STR-265 – Migration: extend cinemas (address, city, country, phone_number, country_code)

---

## Summary

- New migration `1700000000010-AddCinemasLocationContactColumns.ts` adds nullable columns: `address`, `city`, `country`, `phone_number`, `country_code`.
- Uses `ADD COLUMN IF NOT EXISTS` so it is safe if a column was added manually before.
- `Cinema` entity updated to match.

**Run migration:** `npm run migration:run`

---

## Checklist

- [x] Migration forward/backward defined
- [x] Entity aligned with DB
