## Jira

- STR-239 – Download trending movies as PDF. Add your Jira ticket link here if needed.

---

## Summary

**GET /movies/trending/pdf** – Generates and downloads a PDF with the list of trending movies. Public endpoint, no auth.

- **Endpoint:** GET /movies/trending/pdf, `@Public()`. Returns 200 with `application/pdf` and `Content-Disposition: attachment; filename="trending-movies.pdf"`.
- **Implementation:** `MoviesService.generateTrendingPdf()` uses PDFKit to build the PDF (title, date, list of trending movies up to 100). Controller sets headers and streams the buffer.
- **E2E:** `test/movies.e2e-spec.ts` – GET /movies/trending/pdf: 200 with Content-Type application/pdf; Content-Disposition attachment and filename; non-empty PDF buffer (%PDF); valid PDF when no trending movies; public (no auth).

**Files changed:**
- `package.json` – added `pdfkit`, `@types/pdfkit`
- `package-lock.json` – lockfile
- `src/movies/movies.controller.ts` – GET trending/pdf route and handler
- `src/movies/movies.service.ts` – `generateTrendingPdf()` with PDFKit
- `test/movies.e2e-spec.ts` – describe GET /movies/trending/pdf with 5 tests

---

## Tests

| Test / Suite | Result | Screenshot |
| ------------ | ------ | ---------- |
| `test/movies.e2e-spec.ts` GET /movies/trending/pdf | Pass | *(you will add)* |

---

## Swagger documentation

- [x] Endpoint documented with `@ApiOperation`, `@ApiProduces`, `@ApiResponse`
- [ ] Reviewed at http://localhost:5000/api-docs

---

## Checklist

- [x] Code follows project conventions (`.cursorrules`)
- [x] Tests pass (`npm run test:e2e`)
- [x] No lint errors (`npm run lint`)

---

## Postman screenshots

<!-- Paste below -->
