#!/usr/bin/env node

/**
 * Script para generar la colección de Postman desde Swagger/OpenAPI
 *
 * Uso:
 *   node scripts/generate-postman-collection.js
 *
 * Requisitos:
 *   - La aplicación debe estar corriendo en http://localhost:5001
 *   - openapi-to-postmanv2 debe estar instalado
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { convert } = require('openapi-to-postmanv2');

const SWAGGER_URL = 'http://localhost:5001/api-docs-json';
const OUTPUT_FILE = path.join(
  __dirname,
  '../postman/Movie-API.postman_collection.json'
);

async function fetchSwaggerJson() {
  return new Promise((resolve, reject) => {
    http
      .get(SWAGGER_URL, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
            return;
          }
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            reject(new Error(`Failed to parse Swagger JSON: ${error.message}`));
          }
        });
      })
      .on('error', (error) => {
        reject(new Error(`Failed to fetch Swagger JSON: ${error.message}`));
      });
  });
}

async function generatePostmanCollection() {
  try {
    console.log('📥 Fetching Swagger JSON from', SWAGGER_URL);
    const swaggerJson = await fetchSwaggerJson();

    console.log('🔄 Converting Swagger to Postman Collection...');
    const result = await new Promise((resolve, reject) => {
      convert(
        {
          type: 'json',
          data: swaggerJson
        },
        {
          folderStrategy: 'Tags',
          requestParametersResolution: 'Example',
          exampleParametersResolution: 'Example'
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (result.result && result.output && result.output.length > 0) {
      const collection = result.output[0].data;

      // Actualizar metadata de la colección
      collection.info.name = 'Stremio API';
      collection.info.description =
        'Colección de Postman generada automáticamente desde Swagger/OpenAPI';

      // Asegurar que existe el directorio
      const outputDir = path.dirname(OUTPUT_FILE);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Guardar la colección
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(collection, null, 2));
      console.log('✅ Postman Collection generated successfully!');
      console.log('📁 Saved to:', OUTPUT_FILE);
      console.log(
        '\n⚠️  Note: Tests personalizados deben agregarse manualmente en Postman'
      );
      console.log('   y luego exportarse nuevamente para mantenerlos.');
    } else {
      throw new Error('Failed to convert Swagger to Postman Collection');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. The application is running on http://localhost:5001');
    console.error(
      '   2. Swagger is accessible at http://localhost:5001/api-docs'
    );
    process.exit(1);
  }
}

generatePostmanCollection();
