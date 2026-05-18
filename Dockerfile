# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# URL pública del backend (Ingress). DEBE pasarse al construir:
#   docker build --build-arg API_URL=https://api.prospectos.midominio.com .
ARG API_URL=REPLACE_WITH_PROD_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Inyecta la URL real del API en el environment de producción y verifica
# que el placeholder fue reemplazado (si no, el build falla a propósito).
RUN sed -i "s#REPLACE_WITH_PROD_API_URL#${API_URL}#g" src/environments/environment.prod.ts \
 && ! grep -q "REPLACE_WITH" src/environments/environment.prod.ts \
 && npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine AS runtime
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/prospectos-front/browser/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
