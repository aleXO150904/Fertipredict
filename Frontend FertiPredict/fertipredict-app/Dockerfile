# Etapa 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Copiar configuración y paquetes
COPY package.json package-lock.json* ./
RUN npm install

# Copiar código fuente
COPY . .

# Argumento para la URL de la API (útil durante el build de Vite)
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Construir aplicación
RUN npm run build

# Etapa 2: Servir con Nginx
FROM nginx:alpine

# Limpiar carpeta default de nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiar el build compilado
COPY --from=build /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
