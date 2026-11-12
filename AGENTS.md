# AGENTS.md — Регламент проекта Translations Lab

> **Translations Lab** — визуальный линтер для валидации ключей интернационализации (i18n) в проектах переводов.
> Проект работает на английском языке и предназначен для поиска проблем в переводах других проектов.

---

## 📐 Общие принципы

### Язык проекта

- **Все UI-строки, сообщения об ошибках, комментарии в коде** — на английском.
- Проект сам по себе не поддерживает i18n для своего интерфейса.
- Проект **анализирует** переводы других проектов и находит в них проблемы.

### Архитектурные принципы

1. **DRY (Don't Repeat Yourself)** — никаких дублирований данных. Если информация определена в одном месте, она не должна дублироваться в другом.
2. **Configuration over hardcoding** — любые настраиваемые значения (суффиксы, namespace, правила) должны быть в конфигурационных объектах, а не захардкожены.
3. **Dynamic discovery** — использовать Vite `import.meta.glob` для автоматического обнаружения языков и namespace из файлов переводов. Язык берётся из имени файла (`en.json` → `en`), namespace — из ключа первого уровня внутри JSON. **Имена директорий не значат ничего** и не должны использоваться в коде.
4. **Graceful degradation** — если данные не загружены или повреждены, приложение должно продолжить работу без падения.

---

## 🏗️ Структура проекта

```
src/
├── App.tsx                          # Корневой компонент (BrowserRouter + Routes)
├── main.tsx                         # Точка входа
├── components/                      # React-компоненты
│   ├── FileTabs/                    # Вкладки по типу файла
│   ├── FilterBar/                   # Фильтры и поиск
│   ├── GlossaryBadge/               # Бейдж термина глоссария
│   ├── IssueBadge/                  # Бейдж проблемы
│   ├── IssuesTable/                 # Таблица проблем
│   ├── LanguageSwitcher/            # Переключатель языков
│   ├── NavBar/                      # Верхнее меню навигации
│   └── TableRow/                    # Строка таблицы
├── data/                            # Бизнес-логика и данные
│   ├── analysisUtils.ts             # Утилиты анализа
│   ├── namespaces.ts                # Namespace: типы, scope, проектные константы
│   ├── glossaryIndex.ts             # Индекс глоссария
│   ├── i18n.ts                      # Конфигурация i18next и компиляция значений
│   ├── issueTypeConfig.ts           # Конфигурация типов проблем
│   ├── keyAnalysis.ts               # Основной движок анализа
│   ├── languages.ts                 # Утилиты языков
│   ├── queryParams.ts               # URL query params routing
│   ├── rulesConfig.ts               # Конфигурация правил
│   ├── rulesUtils.ts                # Утилиты правил
│   ├── translations.ts              # Загрузка файлов переводов и список namespace
│   ├── translationsDir.ts           # Путь к директории переводов
│   └── translationsGlobPlugin.ts    # Vite plugin для подстановки glob паттерна
├── docs/                            # Документация
├── pages/                           # Страницы приложения
│   ├── KeyValidationPage.tsx        # Главная страница (Overview + таблица проблем)
│   ├── SummaryPage.tsx              # Страница сводки (сырые и скомпилированные значения)
│   └── SummaryPageStyles.css        # Стили SummaryPage
├── translations/                    # Самостоятельные демонстрационные переводы
└── types/                           # TypeScript типы
```

---

## 📝 Соглашения по коду

### TypeScript

- Все функции и компоненты должны иметь типизированные props/params.
- Использовать `type` вместо `interface` для простых типов, `interface` для объектов с методами.
- Избегать `any` — использовать `unknown` если тип действительно неизвестен.

### Именование

- **Компоненты**: PascalCase (`FileTabs`, `FilterBar`)
- **Файлы компонентов**: PascalCase (`FileTabs.tsx`)
- **Функции/переменные**: camelCase (`analyzeKeys`, `selectedLanguage`)
- **Константы**: UPPER_SNAKE_CASE для магических констант (`PLURAL_CONTEXT_SUFFIXES`, `ALL_LANGUAGES`)
- **Типы**: PascalCase (`IssueType`, `KeyIssue`)

### Компоненты

- Каждый компонент в отдельном файле.
- Стили в отдельных `.css` файлах с суффиксом `Styles.css`.
- Props интерфейсы должны быть описаны явно.
- Компоненты должны быть чистыми (pure) где это возможно.

### Данные и бизнес-логика

- Конфигурация правил в [`RULES_CONFIG`](src/data/rulesConfig.ts) — единственный источник правды для правил анализа.
- Типы проблем в [`ISSUE_TYPE_CONFIG`](src/data/issueTypeConfig.ts) — единственный источник для UI-меток проблем.
- Языки и файловые типы обнаруживаются динамически из файловой системы.

---

## 🔧 Правила работы с кодом

### Запрещено

1. **Дублировать данные** — если информация есть в конфиге, не определять её снова в компонентах.
2. **Выводить namespace из имени директории** — namespace берётся только из ключа первого уровня в JSON (`ALL_NAMESPACES` в [`translations.ts`](src/data/translations.ts)).
3. **Захардкоживать namespace строковым литералом** — использовать константы из [`namespaces.ts`](src/data/namespaces.ts) (`DEFAULT_NAMESPACE`, `GLOSSARY_NAMESPACE`, `ADJECTIVES_NAMESPACE`) или scope-конфигурацию правил.
4. **Захардкоживать суффиксы** — использовать константы или конфигурацию.
5. **Добавлять новые legacy exports** — использовать `getNamespaceData()` для доступа к данным.

### Обязательно

1. **Следовать DRY** — если код повторяется, вынести в функцию.
2. **Использовать существующие утилиты** — `flattenObject`, `extractReferences`, `keyExistsInSet`.
3. **Поддерживать конфигурацию** — новые правила добавляются в `RULES_CONFIG`, не в логику.
4. **Комментировать сложную логику** — особенно алгоритмы поиска и сопоставления.

### Конфигурация правил

Новые правила добавляются в [`RULES_CONFIG`](src/data/rulesConfig.ts) с использованием:

- **LanguageScope** — `"all"` или массив языков `[ru, zh]`
- **NamespaceScope** — `"all"` или массив namespace `[dashboard, common]`
- **Include/Exclude pattern** — для точного контроля применимости

---

## 🧪 Тестирование

> `npm run test:demo` проверяет демонстрационные данные через Vite и движок анализа. Дополнительно критические функции требуют unit-покрытия:

**Приоритетные функции для тестов:**
- `extractLemma()` — извлечение леммы из ключа
- `keyExistsInSet()` — проверка существования ключа
- `findSimilarKey()` — поиск похожего ключа
- `toGlossarySingular()` — конвертация множественного числа
- `extractReferences()` — извлечение `$t()` ссылок
- `detectSyntaxErrors()` — обнаружение синтаксических ошибок

---

## 🔄 Процесс изменений

### При добавлении новой проблемы (IssueType)

1. Добавить тип в [`IssueType`](src/types/glossary.ts) в `src/types/glossary.ts`
2. Добавить конфигурацию в [`ISSUE_TYPE_CONFIG`](src/data/issueTypeConfig.ts) в `src/data/issueTypeConfig.ts`
3. Добавить логику обнаружения в [`analyzeFile()`](src/data/keyAnalysis.ts) в `src/data/keyAnalysis.ts`
4. Добавить правило в [`RULES_CONFIG`](src/data/rulesConfig.ts) (если нужно)

### При добавлении нового языка

1. Добавить файл перевода `{lang}.json` в любую директорию переводов
2. Язык будет обнаружен автоматически через `import.meta.glob` (по имени файла)
3. При необходимости добавить правила для языка в [`RULES_CONFIG`](src/data/rulesConfig.ts)

### При добавлении нового namespace

1. Добавить файлы переводов с ключом первого уровня `{namespace}` — namespace будет обнаружен автоматически, директория может называться как угодно
2. Добавить правила для namespace в [`RULES_CONFIG`](src/data/rulesConfig.ts) (cross-block-ref, и др.)

### При переименовании namespace

1. Переименовать ключ первого уровня в файлах переводов
2. Обновить scope-конфигурацию в [`RULES_CONFIG`](src/data/rulesConfig.ts) и константы в [`namespaces.ts`](src/data/namespaces.ts) — это единственные места, где имена namespace записаны вручную

---

## 📊 Ключевые константы и конфигурации

### Множественные формы (Plural Contexts)

| Суффикс | Описание | Языки |
|---------|----------|-------|
| `_only` | Единственное число | ru, zh |
| `_one` | Единственное число | es, pt, tr, en, pt (кроме zh) |
| `_few` | Несколько | ru |
| `_many` | Много | ru, es, pt |
| `_other` | Другое/общее | Все кроме ru |

### Падежи (Case Suffixes)

| Язык | Порядок |
|------|---------|
| ru | `-gen`, `-dat`, `-acc`, `-ins`, `-pre` |
| tr | `-gen`, `-dat`, `-acc`, `-loc`, `-abl` |
| en_devel | `-gen`, `-dat`, `-acc`, `-ins`, `-pre`, `-loc`, `-abl` |

### Правила кросс-ссылок (Cross-Block Ref)

| Namespace | Правила |
|-----------|---------|
| adj | Запрещены любые `$t()` ссылки |
| glossary | Только `glossary:`, без namespace-less |
| common | `glossary:`, `common:`, `adj:`, без namespace-less |
| ui | `common:`, `ui:`, без namespace-less |
| dashboard | Разрешены namespace-less ссылки |
| report | Разрешены namespace-less ссылки |
| entities | Разрешены namespace-less ссылки |

---

## 🌐 URL Query Parameters Routing

The application supports URL-based routing for language and namespace selection.

### Supported params

| Param | Description | Example |
|-------|-------------|---------|
| `lang` | Language code (dynamically discovered) | `?lang=en` |
| `namespace` | Namespace — first-level key of a translation file (dynamically discovered) | `?namespace=dashboard` |

### Behavior

- **Unknown language** → redirects to the first valid language
  - Example: `?lang=bg&namespace=trans` → `?lang=en&namespace=adj`
- **Unknown namespace** → redirects to the first valid namespace
- URL updates automatically when user changes language or tab
- Browser back/forward navigation is supported

### Implementation

- [`src/data/queryParams.ts`](src/data/queryParams.ts) — query param utilities
  - `readQueryParams()` — read current URL params
  - `writeQueryParams(params)` — update URL without page reload
  - `resolveLanguage(code, allLanguages)` — validate language code
  - `resolveNamespace(code, allNamespaces)` — validate namespace

---

## 📝 Комментарии и документация

- Комментарии в коде на английском.
- JSDoc для публичных функций и сложных алгоритмов.
- `TODO` комментарии с указанием автора и контекста: `// TODO(@author): description`
- `FIXME` комментарии с указанием проблемы: `// FIXME: description of the problem`

---

## 🚀 Разработка

### Команды

```bash
npm run dev      # Запуск dev-сервера
npm run build    # Сборка production
npm run lint     # ESLint проверка
npm run preview  # Предпросмотр сборки
```

### Зависимости

- **Runtime:** React 19, React DOM 19
- **Build:** Vite 8, TypeScript 6
- **Lint:** ESLint 10, TypeScript ESLint

---

## 📅 Последнее обновление

- **2026-08-02** — Первоначальное создание AGENTS.md
- **2026-08-02** — Добавлена вторая страница `/summary` и верхнее меню навигации (NavBar)
- **2026-08-02** — Добавлен React Router для маршрутизации между страницами
- **2026-08-02** — Добавлен Vite plugin `translationsGlobPlugin.ts` для подстановки glob паттерна переводов
- **2026-08-02** — SummaryPage расширена: поддержка компиляции значений с разрешением `$t()` ссылок и модификатором `capitalizeFirstLetter`
- **2026-08-02** — App.tsx: добавлен catch-all маршрут (`*`) с редиректом на `/`
- **2026-08-02** — `i18n.ts` добавлен в описание структуры проекта
- **2026-08-02** — `capitalizeFirstLetter` теперь регистрируется как нативный форматтер i18next в `initI18n()` (вместо кастомного резолвера `resolveTReferences`, который был удалён); модификатор применяется рекурсивно на каждом уровне вложенности `$t()`
- **2026-08-02** — Исправлен баг в правиле `redundant-modifier`: `getEffectiveFirstChar()` теперь резолвит точечный путь ключа во вложенной структуре (через `resolveKeyPath()`) вместо плоского lookup, из-за которого правило не срабатывало для ссылок вида `$t(common:auth-data.http-basic-auth, capitalizeFirstLetter)`
- **2026-08-02** — SummaryPage: устранены дубликаты `flattenObject` и `getFileKeyCount` (DRY) — используются версии из `analysisUtils.ts` и `keyAnalysis.ts`
- **2026-08-05** — Namespace вместо «типа файла» как единая сущность по всему приложению: `fileTypes.ts` → [`namespaces.ts`](src/data/namespaces.ts), `getFileData()` → `getNamespaceData()`, `KeyIssue.fileType` → `KeyIssue.namespace`, `resolveFileType()` → `resolveNamespace()`, `FileTypeScope` → `NamespaceScope`, поле правил `fileTypes` → `namespaces`. Имена директорий переводов больше нигде не используются: язык берётся из имени файла, namespace — из ключа первого уровня JSON. Синхронизировано с переименованиями в сабмодуле (`translations` → `dashboard`, папка `adjectives` → `adj`)
