# 🔄 Flujo de Trabajo - Postman Collection

Este documento explica cómo mantener sincronizada la colección de Postman con el código del proyecto.

## 📋 Estado Actual

Actualmente tenemos **dos formas** de trabajar con la colección de Postman:

### 1. **Colección Manual** (Actual)

- Archivos JSON en `postman/` que se importan manualmente a Postman
- Ventaja: Control total sobre tests y ejemplos
- Desventaja: Requiere sincronización manual cuando cambian los endpoints

### 2. **Swagger/OpenAPI** (Nuevo)

- Documentación automática generada desde el código
- Puede exportarse a Postman Collection
- Ventaja: Siempre sincronizada con el código
- Desventaja: No incluye tests personalizados automáticamente

## 🚀 Flujos de Trabajo

### Opción A: Trabajar desde el Código → Postman (Recomendado)

**Cuando agregas/modificas endpoints en el código:**

1. **Actualiza los decoradores Swagger** en tus controllers:

   ```typescript
   @ApiTags('movies')
   @ApiOperation({ summary: 'Create a new movie' })
   @ApiResponse({ status: 201, description: 'Movie created successfully' })
   @Post()
   create(@Body() createMovieDto: CreateMovieDto) {
     // ...
   }
   ```

2. **Inicia la aplicación**:

   ```bash
   npm run start:dev
   ```

3. **Accede a Swagger UI**:

   ```
   http://localhost:5001/api-docs
   ```

4. **Exporta la colección desde Swagger**:
   - En Swagger UI, haz clic en el botón "Download" o "Export"
   - Selecciona "Postman Collection v2.1"
   - Guarda el archivo como `postman/Movie-API.postman_collection.json`

5. **Agrega tus tests personalizados**:
   - Importa la colección exportada en Postman
   - Agrega los tests que necesites
   - Exporta nuevamente desde Postman y reemplaza el archivo en el proyecto

### Opción B: Trabajar desde Postman → Código

**Cuando haces cambios en Postman:**

1. **Exporta la colección desde Postman**:
   - En Postman, haz clic en los tres puntos (...) de la colección
   - Selecciona "Export"
   - Elige "Collection v2.1"
   - Guarda el archivo

2. **Reemplaza el archivo en el proyecto**:

   ```bash
   # Copia el archivo exportado a:
   postman/Movie-API.postman_collection.json
   ```

3. **Actualiza el código si es necesario**:
   - Si agregaste nuevos endpoints en Postman, créalos en el código
   - Si cambiaste estructuras de respuesta, actualiza los DTOs

## 🔧 Scripts Disponibles

### Generar colección desde Swagger (Próximamente)

```bash
# Script para generar automáticamente la colección desde Swagger
npm run postman:generate
```

Este script:

1. Inicia la aplicación temporalmente
2. Descarga el JSON de Swagger
3. Convierte Swagger a Postman Collection
4. Guarda en `postman/Movie-API.postman_collection.json`

### Ejecutar tests de Postman

```bash
# Ejecutar tests con Newman
npm run test:postman

# Generar reporte HTML
npm run test:postman:html
```

## 📝 Mejores Prácticas

### 1. Mantener Tests en Postman

- Los tests automatizados deben estar en la colección de Postman
- Estos tests se ejecutan con `npm run test:postman`
- Los tests NO se generan automáticamente desde Swagger

### 2. Documentación en Swagger

- Usa decoradores `@ApiOperation`, `@ApiResponse`, etc. en los controllers
- Esto genera documentación automática y puede exportarse a Postman

### 3. Sincronización Regular

- **Antes de cada PR**: Verifica que la colección esté sincronizada
- **Después de agregar endpoints**: Exporta desde Swagger y actualiza tests
- **Después de cambios en Postman**: Exporta y commit los cambios

### 4. Variables de Entorno

- Mantén `postman/Movie-API.postman_environment.json` actualizado
- No commitees valores sensibles (tokens, passwords)
- Usa `env.example` para documentar variables necesarias

## 🔄 Proceso Recomendado

### Desarrollo de Nuevo Endpoint

1. **Crea el endpoint en el código** con decoradores Swagger
2. **Inicia la aplicación** y verifica en Swagger UI
3. **Exporta desde Swagger** a Postman Collection
4. **Importa en Postman** y agrega tests personalizados
5. **Exporta desde Postman** y reemplaza el archivo en el proyecto
6. **Ejecuta tests**: `npm run test:postman`
7. **Commit** ambos archivos (código + colección)

### Modificación de Endpoint Existente

1. **Modifica el código** y actualiza decoradores Swagger
2. **Actualiza la colección**:
   - Opción A: Exporta desde Swagger y actualiza tests manualmente
   - Opción B: Edita directamente en Postman y exporta
3. **Ejecuta tests**: `npm run test:postman`
4. **Commit** cambios

## 🛠️ Herramientas Útiles

### openapi-to-postman

Convierte Swagger/OpenAPI a Postman Collection:

```bash
npm install -g openapi-to-postman
openapi-to-postman -s http://localhost:5001/api-docs/json -o postman/Movie-API.postman_collection.json
```

### postman-to-openapi

Convierte Postman Collection a OpenAPI (útil para generar documentación):

```bash
npm install -g postman-to-openapi
postman-to-openapi postman/Movie-API.postman_collection.json -o swagger.json
```

## 📚 Recursos

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [Postman Collection Format](https://schema.getpostman.com/json/collection/v2.1.0/docs/index.html)
- [OpenAPI Specification](https://swagger.io/specification/)

## ⚠️ Notas Importantes

1. **Tests personalizados**: Los tests que agregues en Postman NO se perderán al exportar desde Swagger si los mantienes en el archivo JSON del proyecto

2. **Variables de entorno**: Siempre exporta también el entorno cuando hagas cambios

3. **Versionado**: Considera versionar las colecciones si trabajas con múltiples entornos (dev, staging, prod)

4. **CI/CD**: Los tests de Postman pueden ejecutarse en CI/CD con Newman
