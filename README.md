# 🚀 Task Management System - Full Stack Application

A production-ready, modern full-stack task management application built with **Spring Boot 4 + Spring Security 7** (backend) and **React + Tailwind CSS + Framer Motion** (frontend).

## ✨ Features

### Backend (Spring Boot)
- ✅ **Clean Architecture**: Controller → Service → Repository pattern
- ✅ **JWT Authentication**: Secure token-based authentication with role-based authorization
- ✅ **RESTful API**: Well-designed REST endpoints
- ✅ **Input Validation**: Jakarta Validation with custom error messages
- ✅ **Global Exception Handling**: Centralized error handling with proper HTTP status codes
- ✅ **Pagination & Sorting**: Efficient data retrieval with filters and search
- ✅ **Task Management**: CRUD operations with status, priority, and due dates
- ✅ **Statistics**: Task statistics endpoint for dashboard metrics
- ✅ **Role-Based Authorization**: USER and ADMIN roles
- ✅ **Modern Spring Security 7**: Latest security features

### Frontend (React)
- ✅ **Modern Dark Theme**: Professional dark UI with smooth animations
- ✅ **Tailwind CSS**: Utility-first CSS framework for consistent styling
- ✅ **Framer Motion**: Smooth animations and transitions
- ✅ **Responsive Design**: Mobile-first responsive layout
- ✅ **Toast Notifications**: User-friendly feedback with react-hot-toast
- ✅ **Protected Routes**: Authentication guards for sensitive pages
- ✅ **Real-time Search**: Instant task filtering and search
- ✅ **Dashboard Statistics**: Visual task statistics and progress
- ✅ **Task Management**: Full CRUD operations with modal interface
- ✅ **Loading States**: Proper loading indicators and error handling
- ✅ **Lucide Icons**: Modern, consistent icon set

## 🏗️ Architecture

```
Task Management System/
├── backend/                    # Spring Boot Application
│   ├── src/main/java/
│   │   └── com/amith/taskmanager/
│   │       ├── config/         # Security, OpenAPI configuration
│   │       ├── controller/     # REST controllers (/api/v1)
│   │       ├── dto/            # Data Transfer Objects
│   │       ├── exception/      # Global exception handler + custom exceptions
│   │       ├── filter/         # Correlation-id, rate-limit, CSRF-cookie filters
│   │       ├── model/          # JPA entities (User, Task, RefreshToken)
│   │       ├── repository/     # JPA repositories
│   │       ├── security/       # JWT, cookies, auth filter
│   │       └── service/        # Business logic (@Transactional)
│   └── src/main/resources/
│       ├── application.yml             # common config (no secrets)
│       ├── application-dev.yml         # dev defaults
│       ├── application-prod.yml        # env-only, fail-fast
│       ├── logback-spring.xml          # plain (dev) / JSON (prod) logging
│       └── db/migration/               # Flyway SQL migrations
│
└── frontend/                   # React Application
    ├── src/
    │   ├── components/         # Reusable components (Navbar, ErrorBoundary, …)
    │   ├── context/            # AuthContext (cookie-based session)
    │   ├── hooks/              # React Query hooks, useDebounce
    │   ├── pages/              # Page components (lazy-loaded)
    │   ├── services/           # Axios client + silent refresh
    │   └── test/               # Vitest setup + unit/component tests
    ├── e2e/                    # Playwright smoke tests
    └── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites
- **Java 21** or higher
- **Maven 3.9** or higher
- **PostgreSQL 15** or higher
- **Node.js 20** or higher
- **Docker** (optional, for `docker-compose` and the Testcontainers integration test)

### Quick start with Docker (prod-like)

```bash
cp .env.example .env          # then edit DB_PASSWORD and JWT_SECRET
docker-compose up --build
```

The app is served at `http://localhost` (nginx serves the SPA and proxies `/api` to the
backend). The backend runs the `prod` profile and applies Flyway migrations on startup.

### Backend Setup (local dev)

Configuration is profile-based YAML (`application.yml` + `application-{dev,prod}.yml`).
**Secrets are never hardcoded** — they're loaded from a gitignored `backend/.env` file
(via Spring's `spring.config.import`) or from real environment variables. First time:

```bash
cd backend
cp .env.example .env     # then edit DB_PASSWORD and JWT_SECRET
```

**Option A — no database, no Docker (fastest):** the `local` profile uses an in-memory H2
database, so the only thing it needs from `.env` is `JWT_SECRET`. Data is ephemeral.

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local   # http://localhost:8080
```

**Option B — against PostgreSQL (dev profile, the default):** requires a running PostgreSQL
with a `taskdb` database; credentials come from `.env` (`DB_URL`, `DB_USERNAME`,
`DB_PASSWORD`, `JWT_SECRET`).

```bash
createdb taskdb
mvn spring-boot:run
```

Environment variables always override `.env`, e.g. `DB_PASSWORD=other mvn spring-boot:run`.
In the dev/prod profiles Flyway creates/validates the schema automatically — never edit
tables by hand. See the environment variables below for all overrides.

### Frontend Setup (local dev)

```bash
cd frontend
npm install
npm run dev                  # starts on http://localhost:5173, proxies /api to :8080
```

## ⚙️ Environment Variables

Secrets are **never** committed. The `dev` profile has safe localhost defaults; the `prod`
profile requires every value below and fails fast on startup if one is missing.

### Backend
| Variable | Default (dev) | Description |
|----------|---------------|-------------|
| `SPRING_PROFILES_ACTIVE` | `dev` | `dev`, `prod`, or `test` |
| `DB_URL` | `jdbc:postgresql://localhost:5432/taskdb` | JDBC URL |
| `DB_USERNAME` | `postgres` | DB user |
| `DB_PASSWORD` | `postgres` (dev only) | DB password — **required in prod** |
| `JWT_SECRET` | dev-only string | HMAC signing key, **≥32 chars**, **required in prod** |
| `JWT_ACCESS_EXPIRATION_MS` | `900000` (15 min) | Access-token lifetime |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` (7 days) | Refresh-token lifetime |
| `COOKIE_SECURE` | `false` (dev) / `true` (prod) | Set `true` only over HTTPS |
| `COOKIE_SAME_SITE` | `Lax` (dev) / `Strict` (prod) | Cookie SameSite policy |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated allowed origins |

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | _(empty)_ | Leave empty for same-origin (dev proxy / nginx proxy) |
| `VITE_API_TIMEOUT` | `30000` | Axios timeout (ms) |

## 📡 API Endpoints

All application endpoints are versioned under `/api/v1`. Interactive docs are available at
`/swagger-ui.html` (OpenAPI spec at `/v3/api-docs`).

### Authentication (cookie-based)
- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/login` - Authenticate; sets httpOnly `access_token` + `refresh_token` cookies
- `POST /api/v1/auth/refresh` - Rotate the refresh token and issue a new access token
- `POST /api/v1/auth/logout` - Revoke the refresh token and clear cookies

### Tasks (require auth cookie; mutations require the `X-XSRF-TOKEN` header)
- `GET /api/v1/tasks` - List tasks (pagination, filters, search)
- `GET /api/v1/tasks/statistics` - Task statistics
- `GET /api/v1/tasks/{id}` - Single task
- `POST /api/v1/tasks` - Create task
- `PUT /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task

### Operational
- `GET /actuator/health` - Health, with `liveness`/`readiness` probe groups
- `GET /actuator/prometheus` - Prometheus metrics

## 🎨 UI Features

### Authentication Pages
- **Login Page**: Modern login with form validation and error handling
- **Register Page**: User registration with password confirmation

### Dashboard
- **Statistics Cards**: Visual task statistics with color-coded metrics
- **Task Cards**: Beautiful card-based task display
- **Filter & Search**: Real-time filtering by status, priority, and text search
- **Create Task Modal**: Modal form for task creation and editing
- **Responsive Grid**: Responsive grid layout for different screen sizes

### Design System
- **Dark Theme**: Professional dark color scheme
- **Smooth Animations**: Framer Motion for transitions
- **Hover Effects**: Interactive hover states
- **Toast Notifications**: Non-intrusive feedback
- **Loading States**: Proper loading indicators

## 🔐 Security Features

### Backend
- **httpOnly cookie auth**: JWT access token (short-lived) + rotating refresh token stored in
  `httpOnly`, `Secure`, `SameSite` cookies — not readable by JavaScript, so immune to XSS theft.
- **Refresh-token rotation**: each refresh revokes the old token and issues a new one (server-side store).
- **CSRF protection**: `CookieCsrfTokenRepository` + `X-XSRF-TOKEN` header on state-changing requests.
- **Security headers**: HSTS, `X-Content-Type-Options`, `X-Frame-Options: DENY`, Referrer-Policy, CSP.
- **Rate limiting**: bucket4j throttles login/signup per client IP (5 / 15 min by default).
- **No user enumeration**: unknown-user and wrong-password both return the same generic 401.
- **Password hashing**: BCrypt (strength 12) + complexity validation.
- **Managed migrations**: Flyway owns the schema; Hibernate runs in `validate` mode.
- **Secrets via env**: no credentials in code; `prod` profile fails fast if a secret is missing.

### Frontend
- **No tokens in JS storage**: auth lives entirely in httpOnly cookies; only the non-sensitive
  username/role is cached for instant rendering.
- **Silent refresh**: a single-flight interceptor refreshes on `401` and retries transparently.
- **Protected routes** with a session-restore bootstrap, plus a top-level **error boundary**.
- **Same-origin API** via dev/nginx proxy keeps cookies first-party.

## 🎯 Key Resume Highlights

### Backend Skills Demonstrated
- **Spring Boot 4**: Modern Java framework experience
- **Spring Security 7**: Latest security implementation
- **RESTful API**: Clean API design
- **JPA/Hibernate**: Database ORM expertise
- **JWT Authentication**: Token-based security
- **Clean Architecture**: Proper separation of concerns
- **Exception Handling**: Global error management
- **Input Validation**: Security best practices

### Frontend Skills Demonstrated
- **React 18**: Modern React development
- **Tailwind CSS**: Utility-first CSS framework
- **State Management**: React Context API
- **Framer Motion**: Animation library
- **API Integration**: Axios HTTP client
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Robust error management
- **UI/UX Design**: Professional interface design

## 🧪 Testing

### Backend
```bash
cd backend
mvn clean test     # JUnit 5 + Mockito unit tests, MockMvc integration tests,
                   # and a Testcontainers PostgreSQL test that validates the Flyway
                   # migration (auto-skipped if Docker is unavailable).
```

### Frontend
```bash
cd frontend
npm run lint           # ESLint (strict)
npm run format:check   # Prettier
npm run test           # Vitest + React Testing Library (unit/component)
npm run test:e2e       # Playwright smoke tests (run `npx playwright install` once)
```

## 📦 Deployment

### Docker Compose (recommended)
```bash
cp .env.example .env   # set DB_PASSWORD and a strong JWT_SECRET
docker-compose up -d --build
# Frontend: http://localhost   Backend health: http://localhost/api/.. via proxy
```
Both images are multi-stage; the backend runs as a non-root user with a pinned JDK and
graceful shutdown enabled.

> **HTTPS note:** behind a TLS-terminating proxy in real production, set `COOKIE_SECURE=true`
> and `COOKIE_SAME_SITE=Strict`. They are relaxed in the compose file only because it serves
> plain HTTP on localhost.

### Manual
```bash
cd backend  && mvn clean package -DskipTests   # produces target/*.jar (run with SPRING_PROFILES_ACTIVE=prod)
cd frontend && npm run build                    # produces dist/ for any static host or the nginx image
```

## 🎨 Customization

### Changing the Theme
Edit `tailwind.config.js` to customize colors:
```javascript
theme: {
  extend: {
    colors: {
      background: '#0f172a',  // Your primary background
      primary: '#3b82f6',      // Your primary color
      // ... other colors
    }
  }
}
```

### Adding New Features
- **Backend**: Follow Controller → Service → Repository pattern
- **Frontend**: Use existing components and maintain consistent styling

## 🤝 Contributing

This is a portfolio project designed for software engineering job applications. Feel free to customize and enhance it according to your needs.

## 📄 License

This project is created for educational and portfolio purposes.

## 👤 Author

Created as a production-ready full-stack application for software engineering portfolio.

---

## 🎓 Learning Resources

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring Security Documentation](https://spring.io/projects/spring-security)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion)

---

**Perfect for showcasing your full-stack development skills in software engineering interviews!** 🚀