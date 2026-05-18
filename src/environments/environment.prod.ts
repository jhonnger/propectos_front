// TODO(Fase 0.3): reemplazar REPLACE_WITH_PROD_API_URL con la URL real del backend de produccion
// antes del primer deploy a produccion. Dejar este placeholder evita que un build de prod
// pase silenciosamente con una cadena vacia que rompe todas las llamadas al API.
export const environment = {
  production: true,
  apiUrl: 'REPLACE_WITH_PROD_API_URL'
};
