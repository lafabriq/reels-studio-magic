# Reels Studio Magic

Превращай персонажей в мультфильмы с аудио из Instagram Reels.

🌐 **Live:** https://lafabriq.github.io/reels-studio-magic/

---

## Setup

Сайт работает в **GitHub Actions режиме** — бэкенд не нужен, всё выполняется внутри GitHub. Нужно настроить **два Secrets** в репозитории (единоразово):

### Шаг 1 — Создай GitHub Personal Access Token (PAT)

1. Перейди на https://github.com/settings/tokens?type=beta
2. Нажми **"Generate new token"**
3. Дай название: `reels-studio`
4. Выбери репозиторий: `reels-studio-magic` (только этот репозиторий)
5. Permissions:
   - **Repository → Actions**: `Read and write`
   - **Account permissions → Gists**: `Read and write`
6. Нажми **"Generate token"** и скопируй токен

### Шаг 2 — Получи свой Instagram sessionid

1. Открой https://www.instagram.com в браузере (убедись что залогинен)
2. Открой DevTools: **F12** → вкладка **Application** → **Cookies** → `https://www.instagram.com`
3. Найди cookie `sessionid` и скопируй его значение

### Шаг 3 — Добавь Secrets в репозиторий

Перейди: **github.com/lafabriq/reels-studio-magic → Settings → Secrets and variables → Actions → New repository secret**

Добавь два секрета:

| Name | Value |
|------|-------|
| `VITE_GITHUB_TOKEN` | PAT из шага 1 |
| `IG_SESSION_ID` | sessionid из шага 2 |

### Шаг 4 — Задеплой заново

После добавления секретов запусти деплой:
- Просто сделай любой коммит в `main`, ИЛИ
- Перейди в **Actions → Deploy to GitHub Pages → Run workflow**

---

## Как это работает

Когда ты вставляешь ссылку на Reel на сайте:

1. Сайт вызывает GitHub API → запускает workflow `get-reel.yml`
2. Workflow на серверах GitHub обращается к Instagram API с твоим `IG_SESSION_ID`
3. Получает прямую ссылку на видеофайл и сохраняет в приватный Gist
4. Сайт получает ссылку из Gist и воспроизводит видео

Обычно занимает **20-60 секунд** после нажатия кнопки.

---

## Безопасность

- `VITE_GITHUB_TOKEN` (PAT) попадает в собранный JS-бандл и виден в DevTools.  
  Он имеет права только на запуск workflow этого репозитория и чтение/запись Gist — критичных данных нет.
- `IG_SESSION_ID` хранится только в GitHub Secrets — в JS-код не попадает.
- Для обновления сессии повтори шаг 2-3 с новым `sessionid`.

---

## Разработка

```bash
npm run dev    # http://localhost:8080
npm run build  # production build → dist/
npm test       # vitest
npm run lint   # eslint
```

