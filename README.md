# Movie API - Nest.js

API RESTful para gestión de películas construida con Nest.js, TypeORM y PostgreSQL.

## 🚀 Características

- **Framework**: Nest.js
- **ORM**: TypeORM
- **Base de datos**: PostgreSQL
- **Docker**: Configuración lista para desarrollo
- **Validación**: Class-validator y class-transformer
- **TypeScript**: Totalmente tipado

## 📋 Requisitos Previos

- Node.js 24 LTS o superior
- npm o pnpm
- Docker y Docker Compose (para la base de datos)

## 🛠️ Instalación

1. **Clonar o navegar al proyecto**:

```bash
cd movie-api-nestjs
```

2. **Instalar dependencias**:

```bash
npm install
# o
pnpm install
```

3. **Configurar variables de entorno**:
   Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```env
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=stremio
DB_PASSWORD=stremio_pass
DB_DATABASE=movie_db_dev
PORT=5000
NODE_ENV=development
```

4. **Iniciar PostgreSQL con Docker**:

```bash
docker-compose up -d
```

5. **Ejecutar migraciones**:

```bash
npm run migration:run
```

6. **Ejecutar seeders** (opcional, para poblar la base de datos con datos de ejemplo):

```bash
npm run seed
```

7. **Ejecutar la aplicación**:

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

La aplicación estará disponible en `http://localhost:5000`

## 🗄️ Migraciones y Seeders

### Migraciones

Las migraciones se utilizan para gestionar el esquema de la base de datos de forma versionada.

**Ejecutar migraciones**:

```bash
npm run migration:run
```

**Revertir última migración**:

```bash
npm run migration:revert
```

**Generar nueva migración**:

```bash
npm run migration:generate src/migrations/NombreMigracion
```

### Seeders

Los seeders permiten poblar la base de datos con datos de ejemplo para desarrollo y testing.

**Ejecutar seeders**:

```bash
npm run seed
```

Los seeders limpiarán las tablas existentes (`cast`, `movies`, `actors`) y las poblarán con datos de ejemplo.

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Scripts Disponibles

- `npm run build` - Compila el proyecto
- `npm run start` - Inicia la aplicación
- `npm run start:dev` - Inicia en modo desarrollo con hot-reload
- `npm run start:debug` - Inicia en modo debug
- `npm run start:prod` - Inicia en modo producción
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código con Prettier
- `npm run test` - Ejecuta los tests unitarios
- `npm run migration:run` - Ejecuta las migraciones pendientes
- `npm run migration:revert` - Revierte la última migración
- `npm run migration:generate` - Genera una nueva migración
- `npm run seed` - Ejecuta los seeders para poblar la base de datos

## 🏗️ Estructura del Proyecto

```
src/
├── movies/
│   ├── dto/
│   │   ├── create-movie.dto.ts
│   │   ├── update-movie.dto.ts
│   │   └── search-movie.dto.ts
│   ├── entities/
│   │   └── movie.entity.ts
│   ├── movies.controller.ts
│   ├── movies.service.ts
│   └── movies.module.ts
├── app.module.ts
└── main.ts
```

## 🔧 Configuración

### TypeORM

TypeORM está configurado con `synchronize: false` para usar migraciones en lugar de sincronización automática. Esto garantiza un mejor control del esquema de la base de datos.

### Validación

Las validaciones se aplican automáticamente usando `class-validator` a través del `ValidationPipe` global.

## 📖 Aprender Nest.js

Este proyecto es un ejemplo básico de CRUD con Nest.js. Para aprender más:

- [Documentación oficial de Nest.js](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Nest.js Best Practices](https://docs.nestjs.com/fundamentals/custom-providers)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT
