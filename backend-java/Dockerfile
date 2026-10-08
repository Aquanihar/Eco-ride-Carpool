# Multi-stage build for Raahi Carpool Java Backend
FROM openjdk:21-jdk-slim AS builder

WORKDIR /app
COPY src ./src
RUN mkdir bin && javac -encoding UTF-8 -d bin $(find src -name "*.java")

FROM openjdk:21-jre-slim
WORKDIR /app
COPY --from=builder /app/bin ./bin

ENV PORT=8080
EXPOSE 8080

CMD ["java", "-cp", "bin", "com.raahi.carpool.Main"]
