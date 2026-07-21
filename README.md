<p align="center">
  <img src="frontend/src/assets/logo-importsmart.svg" alt="ImportSmart" width="220" />
</p>

<h1 align="center">ImportSmart</h1>
<p align="center"><b>Plataforma inteligente para cotizar, planificar y controlar importaciones.</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Backend-Java%20%2B%20Spring%20Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white" />
  <img src="https://img.shields.io/badge/Base%20de%20datos-MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white" />
</p>

ImportSmart permite registrar empresas cliente, productos, pedidos y paquetes de
importación, y **calcula automáticamente** el peso volumétrico, el costo real de envío, la
utilidad estimada y la rentabilidad de cada pedido. También simula escenarios de envío
(aéreo vs. marítimo, empaque consolidado vs. separado) y trae el **tipo de cambio del día**
desde una API pública para convertir montos entre dólares, colones y otras divisas.

Su valor: ayuda a un importador a **tomar mejores decisiones antes de comprar** (qué
modalidad conviene, cómo empacar, a qué precio vender para ser rentable), evitando compras
que parecen buenas pero pierden dinero por el flete.

> Curso **Programación Web** · Universidad Latina · Proyecto (30 % de la nota)

---

## 👥 Integrantes

| Nombre | Carné / Rol |
|--------|-------------|
| Axel Soto Castro | |
| Danilo Núñez Rojas | |
| Gabriel Chan Aguilar | |

---

## 🗺️ ¿Por dónde empiezo?

Este documento tiene dos partes bien separadas, tal como lo pide el enunciado del proyecto:

- **🔧 Sección técnica** → para quien va a **instalar y ejecutar** el proyecto (desarrolladores,
  profesor que va a correr el código).
- **📘 Sección manual (manual de usuario)** → para quien va a **usar** la plataforma una vez que
  ya está corriendo (qué hace cada pantalla, qué puede hacer cada tipo de usuario).

Si solo querés correr el proyecto, andá directo a la sección técnica. Si ya lo tenés
corriendo y querés saber cómo usarlo, saltá a la sección manual.

<br />

<p align="center">
  <img src="https://img.shields.io/badge/%F0%9F%94%A7%20SECCI%C3%93N-T%C3%89CNICA-1f6feb?style=for-the-badge&labelColor=0d1117" alt="Sección Técnica" />
</p>

## 1. Arquitectura y cumplimiento del enunciado

| Requisito del enunciado | Cómo lo cumple ImportSmart |
|---|---|
| Lenguaje/framework distinto en front y back | **Front-end:** JavaScript + React (Vite). **Back-end:** Java + Spring Boot. |
| Base de datos (relacional o no) | **MySQL 8** (relacional), esquema en [`database/importsmart_schema.sql`](database/importsmart_schema.sql). |
| No usar frameworks full-stack (.NET, Laravel, Next.js…) | Front y back son **proyectos separados e independientes** que se comunican por API REST. |
| Consumir al menos una API pública externa | **Tipo de cambio** (`open.er-api.com`, sin API key) y, opcionalmente, **Google Gemini** para el chatbot. |
| README como manual técnico y de usuario | Este documento. |

```
┌─────────────────────┐        HTTP/REST + JWT        ┌──────────────────────┐        JDBC        ┌────────────┐
│  Frontend React     │  ───────────────────────────▶ │  Backend Spring Boot │  ────────────────▶ │  MySQL 8   │
│  (Vite, puerto 5173)│ ◀───────────────────────────  │  (puerto 8080)       │ ◀────────────────  │ importsmart│
└─────────────────────┘                                └──────────┬───────────┘                    └────────────┘
                                                                   │  HTTPS
                                                                   ▼
                                                    APIs externas: tipo de cambio (open.er-api.com),
                                                    Google OAuth y Google Gemini (opcionales)
```

---

## 2. Requisitos previos (qué instalar)

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| **Java JDK** | 17+ | `java -version` |
| **Apache Maven** | 3.9+ *(o el Maven integrado del IDE)* | `mvn -version` |
| **Node.js** | 18+ (incluye `npm`) | `node -v` |
| **MySQL** | 8+ (o MariaDB 10.4+) corriendo en `localhost:3306` | `mysql --version` |

No hace falta instalar nada más: no se usan Docker, Python, ni frameworks full-stack.

---

## 3. Cómo ejecutar el proyecto — paso a paso

### Paso 1 — Crear la base de datos

Este script crea la base `importsmart`, todas las tablas y **datos de ejemplo** (empresas,
productos, pedidos con su historial) para que el sistema no arranque vacío.

```bash
# Desde la carpeta del proyecto:
mysql -u root -p < database/importsmart_schema.sql
```

> También podés abrir `database/importsmart_schema.sql` en MySQL Workbench y ejecutarlo con el rayo ⚡.

### Paso 2 — Configurar tus credenciales de MySQL

El backend necesita saber el usuario/contraseña de **tu** MySQL, sin que eso quede subido a
GitHub. Copiá el archivo de ejemplo:

```bash
# Windows
copy backend\application-local.example.properties backend\application-local.properties

# macOS / Linux
cp backend/application-local.example.properties backend/application-local.properties
```

Abrí `backend/application-local.properties` y colocá tu usuario y contraseña reales:

```properties
spring.datasource.username=root
spring.datasource.password=TU_PASSWORD_DE_MYSQL
```

> Este archivo está en `.gitignore` — cada computadora puede tener su propia contraseña sin
> riesgo de subirla por accidente. **No es necesario tocar nada más** para que el sistema
> funcione: el resto de secciones de ese archivo (Google, correo, chatbot IA) son opcionales.

### Paso 3 — Levantar el backend

```bash
cd backend
mvn spring-boot:run
```

El backend queda escuchando en **http://localhost:8080**.
(Alternativa: abrir la carpeta `backend` en tu IDE — IntelliJ, Eclipse, VS Code — y ejecutar
la clase `ImportSmartApplication`.)

### Paso 4 — Levantar el frontend

En **otra terminal**:

```bash
cd frontend
npm install
npm run dev
```

Abrí el navegador en **http://localhost:5173**.

> El frontend usa `http://localhost:8080/api` por defecto. Para cambiarlo, creá un archivo
> `frontend/.env` con `VITE_API_URL=http://localhost:8080/api` (ver `frontend/.env.example`).

### Paso 5 — Iniciar sesión

Usá cualquiera de estas cuentas de prueba (ya vienen creadas por el script del Paso 1):

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@importsmart.com` | `admin123` | Administrador |
| `operador@importsmart.com` | `operador123` | Operador |
| `cliente@importsmart.com` | `cliente123` | Cliente |

O creá una cuenta nueva desde **"Registrate aquí"** en la pantalla de login — queda
automáticamente como rol Cliente.

---

## 4. Funciones opcionales (no son necesarias para que el proyecto corra)

Estas integraciones son un plus, pero el sistema funciona perfectamente sin configurarlas
(se desactivan solas si falta la variable correspondiente):

| Función | Qué hace | Variable(s) en `application-local.properties` |
|---|---|---|
| **Iniciar sesión con Google** | Botón "Iniciar sesión / Registrarse con Google" en Login/Registro | `app.google.client-id`, `app.google.client-secret` *(Google Cloud Console)* |
| **Recuperar contraseña por correo** | Envía el enlace de "olvidé mi contraseña" por email real | `spring.mail.username`, `spring.mail.password` *(App Password de Gmail)* |
| **Asistente del landing (chatbot IA)** | Chat con IA en la página de inicio, responde preguntas generales del negocio | `app.gemini.api-key` *(gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey))* |

Sin esas variables: el botón de Google no aparece, el enlace de recuperación se imprime en
el log del backend en vez de enviarse por correo, y el chatbot responde con un mensaje fijo
invitando a escribir por WhatsApp.

---

## 5. Estructura del proyecto

```
Proyectown/
├── database/
│   └── importsmart_schema.sql      # Esquema MySQL + datos de ejemplo
├── backend/                        # API REST (Java 17 + Spring Boot 3.2)
│   ├── pom.xml
│   └── src/main/java/com/importsmart/
│       ├── model/                  # Entidades JPA
│       ├── repository/             # Spring Data JPA
│       ├── dto/                    # Objetos de transferencia
│       ├── service/                # Lógica de negocio, cálculos, IA
│       ├── controller/             # Endpoints REST
│       ├── security/ + config/     # Autenticación JWT, roles, CORS
│       └── ImportSmartApplication.java
└── frontend/                       # SPA (React + Vite)
    └── src/
        ├── api/                    # Cliente axios + endpoints
        ├── pages/                  # Inicio, Login, Registro, Dashboard, Pedidos...
        ├── components/ + context/  # Navbar, Icon, ChatbotWidget, AuthContext...
        └── styles/theme.css
```

## 6. Fórmulas de negocio (`CalculoService`)

- **Peso volumétrico (kg)** = `(largo × ancho × alto en cm) / 5000`
- **Peso facturable** = `máximo(peso real, peso volumétrico)`
- **Costo de envío** = `peso facturable total × tarifa por kg` (según modalidad aérea/marítima)
- **Utilidad** = `venta − (costo de productos + envío + gastos adicionales)`
- **Margen (%)** = `utilidad / venta × 100`
- **Semáforo de rentabilidad**: `margen ≥ 25%` → **Rentable** · `12%–25%` → **Poco rentable** ·
  `< 12%` → **No rentable**

Los umbrales y el divisor volumétrico son configurables en `application.properties`.

## 7. APIs externas que consume

| API | Para qué | Requiere API key |
|---|---|---|
| [open.er-api.com](https://open.er-api.com) | Tipo de cambio USD → CRC/otras divisas | No |
| Google OAuth 2.0 | Iniciar sesión con Google | Sí *(opcional)* |
| Google Gemini | Respuestas del chatbot del landing | Sí *(opcional)* |

## 8. Principales endpoints REST

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Inicio de sesión (devuelve JWT) |
| POST | `/api/auth/register` | Registro de cuenta nueva (rol Cliente) |
| GET | `/api/auth/google/login` | Redirige al login de Google |
| POST | `/api/auth/forgot-password` / `/reset-password` | Recuperación de contraseña |
| GET/POST/PUT/DELETE | `/api/clientes` | CRUD de empresas cliente |
| GET/POST/PUT/DELETE | `/api/productos` | CRUD de productos |
| GET | `/api/categorias`, `/api/estados`, `/api/tarifas` | Catálogos |
| GET/POST/PUT/DELETE | `/api/pedidos` | Pedidos (crea y recalcula todo) |
| PATCH | `/api/pedidos/{id}/estado` | Cambia el estado (registra línea de tiempo) |
| POST | `/api/simulacion` | Simulador de escenarios de envío |
| GET | `/api/tipo-cambio` | Tipo de cambio externo |
| GET | `/api/cotizaciones/{id}/pdf-cliente` \| `/pdf-interno` | Cotización en PDF |
| GET | `/api/dashboard/kpis` | Indicadores del panel (solo Administrador) |
| POST | `/api/chatbot` | Pregunta al asistente del landing (público, sin login) |

Todas las rutas (excepto `/api/auth/**` y `/api/chatbot`) requieren el header
`Authorization: Bearer <token>`.

## 9. Antes de entregar (evita el cero por binarios)

El enunciado asigna **cero** si el ZIP incluye binarios como `node_modules` o carpetas de
compilación. Antes de comprimir, eliminá:

```
frontend/node_modules
frontend/dist
backend/target
```

En Windows:

```bat
rmdir /s /q frontend\node_modules
rmdir /s /q frontend\dist
rmdir /s /q backend\target
```

Estas carpetas se regeneran solas con `npm install` y `mvn spring-boot:run`.

## 10. Solución de problemas

- **El backend no conecta a MySQL:** revisá usuario/contraseña en
  `backend/application-local.properties` y que el servicio MySQL esté encendido y la base
  `importsmart` creada (Paso 1).
- **El frontend no trae datos / error 401:** verificá que el backend esté corriendo en el
  puerto 8080 y volvé a iniciar sesión.
- **El tipo de cambio aparece con "respaldo":** no hay internet; el sistema sigue
  funcionando con el valor por defecto (`app.tipocambio.fallback`).
- **No aparece el botón de Google / el chatbot responde con mensaje fijo:** son funciones
  opcionales (ver sección 4) — el resto del sistema funciona igual sin configurarlas.

<br />

<p align="center">
  <img src="https://img.shields.io/badge/%F0%9F%93%98%20SECCI%C3%93N-MANUAL%20DE%20USUARIO-2ea44f?style=for-the-badge&labelColor=0d1117" alt="Sección Manual de Usuario" />
</p>

## 1. ¿Qué es ImportSmart?

Es la plataforma web de una empresa importadora. Desde ahí:

- Los **clientes** piden cotizaciones y siguen el estado de sus importaciones.
- El **equipo operativo** gestiona la logística de cada pedido.
- La **administración** controla costos, utilidad y rentabilidad del negocio.

## 2. Cómo entrar

Al abrir `http://localhost:5173` verás la **página de inicio** (landing), con información
del servicio, un asistente de chat con IA y un botón para **iniciar sesión** o
**registrarte**.

- **Iniciar sesión**: con correo y contraseña, o con el botón de Google (si está configurado).
- **Registrarte**: nombre, correo, teléfono y contraseña (mínimo 8 caracteres, con una
  mayúscula y un carácter especial). Tu cuenta queda automáticamente como **Cliente**.
- **Olvidé mi contraseña**: pedí un enlace de recuperación desde la pantalla de login.

## 3. Qué puede hacer cada tipo de usuario

| | Administrador | Operador | Cliente |
|---|:---:|:---:|:---:|
| Ver Dashboard (KPIs, gráficos) | ✅ | ❌ | ❌ |
| Ver todos los pedidos | ✅ | ✅ | Solo los propios |
| Crear un pedido nuevo | ✅ | ❌ | ✅ |
| Cambiar el estado de un pedido | ✅ | ✅ | ❌ |
| Ver costos, utilidad y rentabilidad | ✅ | ❌ | ❌ |
| Gestionar clientes (empresas) | ✅ | ❌ | ❌ |
| Ver/gestionar productos | ✅ | Solo ver | Solo ver |
| Usar el Simulador de escenarios | ✅ | ✅ | ✅ (como "Cotizador") |
| Rastrear un pedido por su código | ✅ | ✅ | ✅ |

Estos permisos se aplican **en el backend** (no solo se ocultan botones): un Operador nunca
recibe los montos financieros aunque intente consultarlos directamente.

## 4. Tour por las pantallas

- **Inicio** — Landing pública: qué ofrece ImportSmart, cómo funciona el proceso, y un
  asistente de chat que responde preguntas generales (tarifas, tiempos, cómo cotizar).
- **Dashboard** *(solo Administrador)* — Pedidos activos, utilidad y ventas acumuladas,
  gráfico de productos más rentables, semáforo de rentabilidad y el tipo de cambio del día.
- **Pedidos / Mis pedidos** — Lista de pedidos con su modalidad de envío, estado y (según tu
  rol) venta/utilidad/rentabilidad. Al abrir un pedido ves productos, paquetes, pesos
  (real/volumétrico/facturable), la **línea de tiempo** de estados, y podés **descargar la
  cotización en PDF**. También hay un buscador para rastrear un pedido por su código.
- **Nuevo pedido / Crear pedido** — Elegís la empresa (o sos vos mismo si sos Cliente), la
  modalidad de envío, agregás productos y paquetes (dimensiones + peso). El sistema
  **calcula en vivo** el peso volumétrico, el costo de envío, la utilidad y la rentabilidad.
- **Simulador / Cotizador** — Compara **aéreo vs. marítimo** (costo, tiempo, utilidad) y
  **empaque consolidado vs. separado**, recomendando la mejor opción antes de comprar.
- **Clientes** *(solo Administrador)* — Alta, edición y borrado de las empresas cliente.
- **Productos** — Catálogo con costo, precio de venta, peso y dimensiones. El borrado es
  lógico (desactiva el producto) para no afectar pedidos ya existentes.

## 5. Sobre el tipo de cambio

Los montos se pueden ver en dólares, colones u otras divisas gracias a una API pública de
tipo de cambio que se actualiza automáticamente una vez al día. Si en algún momento no hay
conexión a internet, el sistema sigue funcionando con el último valor conocido.

## 6. ¿Algo no funciona?

Si algo no responde como esperás usando la plataforma ya instalada, revisá la sección
**"Solución de problemas"** dentro de la parte técnica de este mismo documento (punto 10).
