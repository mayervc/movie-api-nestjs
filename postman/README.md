# 📬 Postman Collection - Stremio API

Esta carpeta contiene la colección de Postman con tests automatizados para la API.

## 📁 Archivos

- `Movie-API.postman_collection.json` - Colección de Postman con todos los endpoints y tests
- `Movie-API.postman_environment.json` - Variables de entorno para desarrollo local
- `WORKFLOW.md` - Guía detallada del flujo de trabajo y sincronización

## 🚀 Inicio Rápido

### 1. Importar en Postman

1. Abre Postman
2. Haz clic en **Import**
3. Selecciona ambos archivos:
   - `Movie-API.postman_collection.json`
   - `Movie-API.postman_environment.json`
4. Selecciona el entorno **"Stremio API - Local"** en el dropdown superior derecho

### 2. Ejecutar Tests

```bash
# Desde terminal (con Newman)
npm run test:postman

# Con reporte HTML
npm run test:postman:html
```

## 🔄 Sincronización con el Código

### Opción 1: Generar desde Swagger (Recomendado)

Cuando agregas/modificas endpoints en el código:

1. **Inicia la aplicación**:

   ```bash
   npm run start:dev
   ```

2. **Genera la colección desde Swagger**:

   ```bash
   npm run postman:generate
   ```

3. **Importa en Postman** y agrega tus tests personalizados

4. **Exporta desde Postman** y reemplaza el archivo en el proyecto

### Opción 2: Exportar desde Postman

Cuando haces cambios directamente en Postman:

1. En Postman: **Export** → Collection v2.1
2. Guarda el archivo como `postman/Movie-API.postman_collection.json`
3. Commit los cambios

## 📋 Endpoints Incluidos

### Auth

- `POST /auth/login` - Autenticar usuario y obtener token JWT

### Movies

- `POST /movies` - Crear una nueva película
- `GET /movies` - Obtener todas las películas
- `GET /movies/:id` - Obtener una película por ID
- `PATCH /movies/:id` - Actualizar una película
- `POST /movies/search` - Buscar películas
- `DELETE /movies/:id` - Eliminar una película

## 🧪 Tests Automatizados

Cada endpoint incluye tests que verifican:

- ✅ Códigos de estado HTTP correctos
- ✅ Estructura de respuesta esperada
- ✅ Tiempo de respuesta (performance)
- ✅ Validaciones de datos

## 📚 Documentación

- **Swagger UI**: `http://localhost:5001/api-docs` (cuando la app está corriendo)
- **Flujo de trabajo**: Ver `WORKFLOW.md` para detalles sobre sincronización

## ⚠️ Notas Importantes

1. **Tests personalizados**: Los tests que agregues en Postman deben exportarse y commitearse
2. **Variables de entorno**: El archivo `Movie-API.postman_environment.json` contiene las variables necesarias
3. **Sincronización**: Usa `npm run postman:generate` después de agregar/modificar endpoints
