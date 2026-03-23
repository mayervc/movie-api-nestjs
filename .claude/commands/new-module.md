Create a complete NestJS feature module following this project's conventions.

## What to scaffold

Given the module name `$ARGUMENTS`, create all of the following files:

### Entity — `src/$module/entities/$module.entity.ts`
- Use `@Entity('$plural_snake_case')` as table name
- Include `@PrimaryGeneratedColumn()`, `@CreateDateColumn({ name: 'created_at' })`, `@UpdateDateColumn({ name: 'updated_at' })`
- Use explicit column names (`name: 'snake_case'`) for multi-word fields
- No `any` types

### DTOs — `src/$module/dto/`
- `create-$module.dto.ts` — class-validator decorators on every field, `@IsOptional()` for optional ones
- `update-$module.dto.ts` — `export class Update$ModuleDto extends PartialType(Create$ModuleDto) {}`

### Service — `src/$module/$module.service.ts`
- Inject repository via `@InjectRepository($Entity)`
- Implement: `create`, `findAll`, `findOne`, `update`, `remove`
- `findOne` must throw `NotFoundException` if not found
- `create` must catch unique constraint violations and throw `ConflictException`
- No `any` types, no passwords in return values

### Controller — `src/$module/$module.controller.ts`
- CRUD routes: `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`
- `POST`, `PATCH`, `DELETE` require `@Roles(UserRole.ADMIN)` and `@ApiBearerAuth()`
- `GET` routes are `@Public()`
- `DELETE` returns `@HttpCode(204)`
- Every endpoint has `@ApiOperation({ summary: '...' })` and `@ApiResponse(...)`
- No emojis in comments or logs

### Module — `src/$module/$module.module.ts`
- `TypeOrmModule.forFeature([$Entity])`
- Export the service

### Register
- Add the entity to `src/config/entities.ts`
- Import the module in `src/app.module.ts`

### Migration
- Ask if a migration should also be created, then run `npm run migration:generate -- src/migrations/Create$ModuleTable`

## Conventions reminder
- camelCase variables/functions, PascalCase classes, UPPER_SNAKE_CASE enums
- DTO prefix: `Create*Dto`, `Update*Dto`
- Swagger on every endpoint
- Hash passwords with bcrypt if the entity has a password field
