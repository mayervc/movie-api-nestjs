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

- Node.js 18+ 
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
PORT=3000
NODE_ENV=development
```

4. **Iniciar PostgreSQL con Docker**:
```bash
docker-compose up -d
```

5. **Ejecutar la aplicación**:
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

La aplicación estará disponible en `http://localhost:3000`

## 📚 Endpoints de Movies

### GET /movies
Obtiene todas las películas.

**Respuesta**:
```json
[
  {
    "id": 1,
    "title": "Inception",
    "releaseDate": "2010-07-16",
    "genres": ["Action", "Sci-Fi"],
    "duration": 148,
    "trending": true,
    "rating": 8.8,
    "imageUrl": "https://...",
    "description": "...",
    "clasification": "PG-13",
    "tmdbId": 27205,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /movies/:id
Obtiene una película por ID.

### POST /movies
Crea una nueva película.

**Body**:
```json
{
  "title": "Inception",
  "releaseDate": "2010-07-16",
  "genres": ["Action", "Sci-Fi"],
  "duration": 148,
  "trending": true,
  "rating": 8.8,
  "imageUrl": "https://...",
  "description": "A mind-bending thriller",
  "clasification": "PG-13"
}
```

### PATCH /movies/:id
Actualiza una película existente.

**Body** (campos opcionales):
```json
{
  "rating": 9.0,
  "trending": false
}
```

### DELETE /movies/:id
Elimina una película.

### POST /movies/search
Busca películas por título o descripción.

**Body**:
```json
{
  "query": "inception",
  "page": 1,
  "limit": 10
}
```

## 🗄️ Estructura de la Base de Datos

La tabla `movies` tiene los siguientes campos:

- `id` (PK, auto-increment)
- `title` (string, único, requerido)
- `release_date` (date, requerido)
- `genres` (array de strings, opcional)
- `duration` (integer, requerido, mínimo 1)
- `trending` (boolean, default: false)
- `rating` (decimal 3,1, opcional, rango 0-10)
- `image_url` (string, opcional)
- `description` (text, opcional)
- `clasification` (string, opcional)
- `tmdb_id` (integer, único, opcional)
- `created_at` (timestamp)
- `updated_at` (timestamp)

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

TypeORM está configurado para sincronizar automáticamente el esquema en desarrollo (`synchronize: true`). En producción, se recomienda usar migraciones.

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


