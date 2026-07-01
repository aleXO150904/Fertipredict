FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copiamos el archivo POM y las fuentes
COPY pom.xml .
COPY src ./src

# Compilamos y empaquetamos el proyecto omitiendo los tests (para un build más rápido en despliegue)
RUN mvn clean package -DskipTests

# Etapa 2: Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiamos el JAR generado en la etapa de build
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
