# Подключение бота Макс — план работ

## Статус
Бот создан, ожидает проверки модерации (~1 день). После одобрения — продолжить подключение по этому плану.

## Что нужно от пользователя после модерации
1. Токен бота из личного кабинета Макс (dev.max.ru или Master Bot)
2. Добавить токен в секреты проекта под именем `MAX_BOT_TOKEN`

## API Макса — ключевые факты

### Отправка сообщения пользователю
- **Endpoint:** `POST https://botapi.max.ru/messages?user_id={user_id}&access_token={token}`
- **Альтернатива:** токен можно передавать в query `?access_token=` или в заголовке
- **Body:** `{"text": "текст сообщения"}`
- **Content-Type:** `application/json`
- Пользователь должен сначала написать боту `/start` — без этого отправить сообщение нельзя

### Приём обновлений (webhook)
- **Endpoint:** `POST https://botapi.max.ru/subscriptions?access_token={token}`
- **Body:** `{"url": "<URL нашей функции max-webhook>", "update_types": ["message_created", "bot_started"]}`
- Макс будет слать POST на наш webhook при событиях
- Альтернатива — long polling через `GET /updates`, но webhook надёжнее

### Структура события bot_started / message_created
```json
{
  "update_type": "bot_started",
  "timestamp": 1234567890,
  "chat_id": 123,
  "user": {
    "user_id": 456,
    "name": "Имя",
    "username": "nickname"
  }
}
```

## План реализации (4 шага)

### 1. Миграция БД
Создать таблицу `max_subscribers`:
```sql
CREATE TABLE max_subscribers (
  id SERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  chat_id BIGINT,
  name TEXT,
  username TEXT,
  subscribed_at TIMESTAMP DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);
CREATE INDEX idx_max_subs_active ON max_subscribers(is_active);
```

### 2. Backend: `/backend/max-webhook/index.py`
- Принимает POST от Макса
- На `bot_started` — INSERT/UPDATE в `max_subscribers` (is_active=true)
- На `message_created` с текстом `/stop` — is_active=false
- Возвращает 200 OK быстро

### 3. Backend: `/backend/max-send/index.py`
- POST, только для роли owner (проверка `X-User-Role`)
- Body: `{"title": "...", "message": "..."}`
- Читает всех активных подписчиков из `max_subscribers`
- Для каждого делает `POST https://botapi.max.ru/messages?user_id={user_id}&access_token={MAX_BOT_TOKEN}`
- Формат текста: `*{title}*\n\n{message}` (Markdown в Максе поддерживается)
- Возвращает `{"sent": N, "failed": M}`
- Токен бота из `os.environ['MAX_BOT_TOKEN']`

### 4. Регистрация webhook (одноразово после получения токена)
Через curl или функцию-установщик:
```bash
curl -X POST "https://botapi.max.ru/subscriptions?access_token=TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "URL_из_func2url.json_для_max-webhook", "update_types": ["bot_started", "message_created"]}'
```

### 5. Frontend: изменить `OwnerDashboard.tsx`
- Текущий блок "Пуш-уведомления" → заменить на "Уведомления в Макс"
- Кнопка вызывает `func2url["max-send"]` вместо `push-send`
- Добавить счётчик подписчиков бота (опционально: GET `/max-send` → возвращает count)
- Оставить текущую схему с title + message

## Что НЕ трогать
- Оставить пуш-функции (`push-send`, `push-subscribe`) в коде — не удалять, могут пригодиться
- Service Worker в `/public/sw.js` не трогать
- Таблица `push_subscriptions` остаётся

## Требуемые секреты
- `MAX_BOT_TOKEN` — токен бота из dev.max.ru

## Ссылка-приглашение для подписчиков
После регистрации бот будет доступен по ссылке вида `https://max.ru/{bot_username}`. Эту ссылку нужно будет разместить там, где сотрудники её увидят (например, добавить в панель владельца с кнопкой "Скопировать").

## Напоминание
Пользователь попросил напомнить о продолжении работы на следующий день после модерации бота. Если в новом диалоге пользователь упоминает Макс, бота или уведомления — сразу открыть этот файл и продолжить с плана.
