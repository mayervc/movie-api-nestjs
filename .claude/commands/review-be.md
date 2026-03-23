Review the backend code in scope (`$ARGUMENTS` or current staged/modified files) against this project's NestJS conventions.

## Checklist to evaluate

### Auth & Security
- [ ] Protected routes have `@Roles(UserRole.ADMIN)` + `@ApiBearerAuth()`
- [ ] Public routes have `@Public()`
- [ ] Passwords are hashed with bcrypt before saving
- [ ] Passwords are NOT returned in any response
- [ ] No sensitive data exposed in error messages

### DTOs & Validation
- [ ] Every DTO field has class-validator decorators
- [ ] Optional fields use `@IsOptional()`
- [ ] `UpdateDto` uses `PartialType(CreateDto)`
- [ ] No `any` types anywhere

### Service
- [ ] `findOne` throws `NotFoundException` when entity not found
- [ ] `create` catches unique constraint violations and throws `ConflictException`
- [ ] Repository injected via `@InjectRepository()`
- [ ] No business logic leaking into controller

### Controller
- [ ] Every endpoint has `@ApiOperation({ summary: '...' })` and `@ApiResponse(...)`
- [ ] `DELETE` uses `@HttpCode(204)`
- [ ] `POST` (create) returns 201 implicitly or explicitly
- [ ] No emojis in comments or `console.log`/`console.error`

### Module
- [ ] Entity registered in `TypeOrmModule.forFeature([...])`
- [ ] Service exported if used by other modules
- [ ] Module imported in `AppModule`

### Entity
- [ ] Table name is explicit plural snake_case: `@Entity('table_name')`
- [ ] Multi-word column names use `name: 'snake_case'`
- [ ] `@CreateDateColumn` and `@UpdateDateColumn` present

## Output format

Report findings grouped by severity:
- **Critical** — security issues, data exposure
- **Warning** — missing validation, wrong status codes, missing Swagger
- **Style** — naming, emojis, explicit types

For each finding, include the file path and line number.
If everything is correct, say so explicitly.
