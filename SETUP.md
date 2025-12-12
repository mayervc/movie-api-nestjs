# Guía de Setup Rápido

## Pasos para comenzar

### 1. Instalar dependencias
```bash
npm install
# o
pnpm install
```

### 2. Configurar variables de entorno
Copia el archivo de ejemplo y ajusta si es necesario:
```bash
cp env.example .env
```

El archivo `.env` debería contener:
```env
DB_HOST=localhost
DB_PORT=5434
DB_USERNAME=stremio
DB_PASSWORD=stremio_pass
DB_DATABASE=movie_db_dev
PORT=3000
NODE_ENV=development
```

### 3. Iniciar PostgreSQL con Docker
```bash
docker-compose up -d
```

Espera unos segundos a que la base de datos esté lista. Puedes verificar con:
```bash
docker-compose ps
```

### 4. Ejecutar la aplicación
```bash
npm run start:dev
```

La aplicación estará disponible en `http://localhost:3000`

### 5. Probar la API

#### Crear una película:
```bash
curl -X POST http://localhost:3000/movies \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Inception",
    "releaseDate": "2010-07-16",
    "genres": ["Action", "Sci-Fi"],
    "duration": 148,
    "trending": true,
    "rating": 8.8,
    "description": "A mind-bending thriller about dreams",
    "clasification": "PG-13"
  }'
```

#### Obtener todas las películas:
```bash
curl http://localhost:3000/movies
```

#### Obtener una película por ID:
```bash
curl http://localhost:3000/movies/1
```

#### Actualizar una película:
```bash
curl -X PATCH http://localhost:3000/movies/1 \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 9.0
  }'
```

#### Buscar películas:
```bash
curl -X POST http://localhost:3000/movies/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "inception",
    "page": 1,
    "limit": 10
  }'
```

#### Eliminar una película:
```bash
curl -X DELETE http://localhost:3000/movies/1
```

## Solución de Problemas

### Error de conexión a la base de datos
- Verifica que Docker esté corriendo: `docker ps`
- Verifica que el contenedor de PostgreSQL esté activo: `docker-compose ps`
- Verifica las credenciales en el archivo `.env`

### Error de puerto en uso
- Cambia el puerto en el archivo `.env` (PORT=3001)
- O detén el proceso que está usando el puerto 3000

### Error de TypeORM
- Asegúrate de que la base de datos esté corriendo antes de iniciar la app
- Verifica que `synchronize: true` esté en desarrollo (ya está configurado)

## Próximos Pasos

1. Explora la estructura del código en `src/movies/`
2. Lee la documentación de Nest.js: https://docs.nestjs.com/
3. Experimenta agregando nuevos endpoints o validaciones
4. Agrega autenticación y autorización si lo necesitas


