# Task Manager API

REST API для управления задачами с аутентификацией JWT. Node.js + TypeScript + Express + Prisma v4 + PostgreSQL.

## Архитектура

```mermaid
graph TB
    A[Client] --> B[Express Server]
    B --> C[JWT Middleware]
    B --> D[Prisma Client]
    D --> E[PostgreSQL Database]
    C --> F[User Auth]
    D --> G[Task CRUD]
```

## Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/register | Регистрация пользователя | Нет |
| POST | /auth/login | Вход, получение JWT | Нет |
| GET | /tasks | Получить все задачи пользователя | JWT |
| POST | /tasks | Создать задачу | JWT |
| PUT | /tasks/:id | Обновить задачу (toggle completed) | JWT |
| DELETE | /tasks/:id | Удалить задачу | JWT |
| GET | /health | Проверка здоровья | Нет |

## Переменные окружения

Создайте `.env` файл в корне проекта:

```env
# Database
DATABASE_URL="postgresql://neondb_owner:npg_pxB6tdNQ8vZL@ep-silent-block-aihtgoxa-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Server
PORT=3000

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRY="7d"
```

### Формат DATABASE_URL для Neon PostgreSQL:
```
postgresql://[username]:[password]@[host]/[database]?sslmode=require&channel_binding=require
```

Где:
- `username`: имя пользователя базы данных (neondb_owner)
- `password`: пароль базы данных
- `host`: хост сервера Neon
- `database`: имя базы данных (neondb)
- `sslmode=require`: обязательное SSL соединение
- `channel_binding=require`: дополнительная безопасность

## Метрики (Day 1)

- ✅ 5 CRUD операций работают
- ✅ JWT аутентификация
- ✅ PostgreSQL база данных (Neon)
- ✅ Docker контейнеризация
- ✅ GitHub Actions CI/CD
- ✅ Vercel deployment

## Установка

1. Клонировать репозиторий
2. `npm install`
3. Настроить `.env` файл (см. выше)
4. `npx prisma generate`
5. `npx prisma migrate dev --name init`
6. `npm run dev`

## Docker

```bash
docker-compose up --build
```

## Деплой на Vercel

1. Подключить GitHub репозиторий к Vercel
2. Добавить Environment Variables в Vercel Dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRY`
3. Деплой запустится автоматически

## Тестирование

```bash
# Регистрация
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Вход
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'

# Получить задачи (с токеном)
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Roadmap

- Day 1: Фиксы + Docker + CI
- Day 2-7: NestJS миграция
- Day 8-15: GraphQL + WebSocket
- Day 16-30: Масштабирование (Redis, тесты, Railway)