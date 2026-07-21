# ImportSmart

Plataforma inteligente para cotizar, planificar y controlar importaciones.

ImportSmart permite registrar empresas cliente, productos, pedidos y paquetes de
importación, y calcula automáticamente el peso volumétrico, el costo real de envío, la
utilidad estimada y la rentabilidad de cada pedido. También simula escenarios de envío
(aéreo vs. marítimo, empaque consolidado vs. separado) y trae el tipo de cambio del día
desde una API pública para convertir montos entre dólares, colones y otras divisas.

Su valor: ayuda a un importador a tomar mejores decisiones antes de comprar (qué
modalidad conviene, cómo empacar, a qué precio vender para ser rentable), evitando compras
que parecen buenas pero pierden dinero por el flete.

Curso Programación Web · Universidad Latina · Proyecto (30 % de la nota)

---

## Integrantes

| Nombre | Carné / Rol |
|--------|-------------|
| Axel Soto Castro | |
| Danilo Núñez Rojas | |
| Gabriel Chan Aguilar | |

---

## ¿Por dónde empiezo?

Este documento tiene dos partes bien separadas, tal como lo pide el enunciado del proyecto:

- Sección técnica → para quien va a instalar y ejecutar el proyecto (desarrolladores,
  profesor que va a correr el código).
- Sección manual (manual de usuario) → para quien va a usar la plataforma una vez que
  ya está corriendo (qué hace cada pantalla, qué puede hacer cada tipo de usuario).

Si solo querés correr el proyecto, andá directo a la sección técnica. Si ya lo tenés
corriendo y querés saber cómo usarlo, saltá a la sección manual.

---

# SECCIÓN TÉCNICA

## 1. Cumplimiento del enunciado

| Requisito del enunciado | Cómo lo cumple ImportSmart |
|---|---|
| Lenguaje/framework distinto en front y back | Front-end: JavaScript + React (Vite). Back-end: Java + Spring Boot. |
| Base de datos (relacional o no) | MySQL 8 (relacional), esquema en `database/importsmart_schema.sql`. |
| No usar frameworks full-stack (.NET, Laravel, Next.js…) | Front y back son proyectos separados e independientes, cada uno con su propio servidor, que se comunican por API REST. |
| Tecnologías separadas e independientes para front y back | Carpetas independientes (`frontend/`, `backend/`), sin código compartido; se despliegan y ejecutan por separado. |
| Consumir al menos una API pública externa | Tipo de cambio (`open.er-api.com`, gratuita, sin API key) — ver sección 7. |
| README con integrantes y pasos para correr el proyecto | Este documento. |

```
Frontend React (Vite, puerto 5173)
        │  HTTP/REST + JWT
        ▼
Backend Spring Boot (puerto 8080)
        │  JDBC
        ▼
MySQL 8 (base "importsmart")

El backend tambien consume APIs externas por HTTPS:
tipo de cambio (open.er-api.com), y opcionalmente Google OAuth y Google Gemini.
```

---

## 2. Requisitos previos (qué instalar)

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| Java JDK | 17+ | `java -version` |
| Apache Maven | 3.9+ (o el Maven integrado del IDE) | `mvn -version` |
| Node.js | 18+ (incluye npm) | `node -v` |
| MySQL Server | 8+ (o MariaDB 10.4+) corriendo en localhost:3306 | Abrir MySQL Workbench y conectar |
| MySQL Workbench | Para crear la base de datos y correr el script (ver Paso 1) | Abrir el programa |

No hace falta instalar nada más: no se usan Docker, Python, ni frameworks full-stack.
Cualquier editor sirve para abrir el proyecto (Visual Studio Code, IntelliJ, Eclipse).

---

## 3. Cómo ejecutar el proyecto — paso a paso

### Paso 1 — Crear la base de datos

Este script crea la base `importsmart`, todas las tablas, el usuario de MySQL que usa el
backend (`importsmart` / `importsmart123`, con permisos ya otorgados) y datos de
ejemplo (empresas, productos, pedidos con su historial), para que el sistema no arranque
vacío.

Ejecutalo desde MySQL Workbench (no hace falta usar la terminal):

1. Abrí MySQL Workbench y conectate a tu servidor MySQL local con un usuario que pueda
   crear usuarios (por ejemplo, root).
2. Menú File > Open SQL Script... y seleccioná el archivo `database/importsmart_schema.sql`
   del proyecto.
3. Con el script abierto, seleccioná todo el contenido (Ctrl+A).
4. Hacé clic en el ícono del rayo (Execute) en la barra de herramientas para correr todo
   el script.
5. Esperá a que el panel de abajo (Output) muestre que todas las instrucciones se
   ejecutaron sin errores.

Con esto no hace falta tocar ningún archivo de configuración: el backend ya viene
preparado para conectarse con el usuario que el script acaba de crear.

¿Preferís usar tu propio usuario root de MySQL en vez del usuario dedicado? Copiá
`backend/application-local.example.properties` como `backend/application-local.properties`
y colocá ahí tu usuario/contraseña — ese archivo pisa la configuración por defecto y no
se sube a Git. No es necesario para que el proyecto funcione, es solo una alternativa.

### Paso 2 — Levantar el backend

```bash
cd backend
mvn spring-boot:run
```

El backend queda escuchando en http://localhost:8080.
(Alternativa: abrir la carpeta `backend` en tu IDE y ejecutar la clase `ImportSmartApplication`.)

### Paso 3 — Levantar el frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

Abrí el navegador en http://localhost:5173.

El frontend usa http://localhost:8080/api por defecto. Para cambiarlo, creá un archivo
`frontend/.env` con `VITE_API_URL=http://localhost:8080/api` (ver `frontend/.env.example`).
En Windows, si `npm` no se reconoce como comando, probá `npm.cmd install` / `npm.cmd run dev`.

### Paso 4 — Iniciar sesión

Usá cualquiera de estas cuentas de prueba (ya vienen creadas por el script del Paso 1):

| Correo | Contraseña | Rol |
|---|---|---|
| admin@importsmart.com | admin123 | Administrador |
| operador@importsmart.com | operador123 | Operador |
| cliente@importsmart.com | cliente123 | Cliente |

O creá una cuenta nueva desde "Registrate aquí" en la pantalla de login — queda
automáticamente como rol Cliente.

---

## 4. Funciones opcionales (no son necesarias para que el proyecto corra)

Estas integraciones son un plus, pero el sistema funciona perfectamente sin configurarlas
(se desactivan solas si falta la variable correspondiente):

| Función | Qué hace | Variable(s) en application-local.properties |
|---|---|---|
| Iniciar sesión con Google | Botón "Iniciar sesión / Registrarse con Google" en Login/Registro | `app.google.client-id`, `app.google.client-secret` (Google Cloud Console) |
| Recuperar contraseña por correo | Envía el enlace de "olvidé mi contraseña" por email real | `spring.mail.username`, `spring.mail.password` (App Password de Gmail) |
| Asistente del landing (chatbot IA) | Chat con IA en la página de inicio, responde preguntas generales del negocio | `app.gemini.api-key` (gratis en https://aistudio.google.com/apikey) |

Sin esas variables: el botón de Google no aparece, el enlace de recuperación se imprime en
el log del backend en vez de enviarse por correo, y el chatbot responde con un mensaje fijo
invitando a escribir por WhatsApp — el resto del sistema funciona exactamente igual.

---

## 5. Estructura del proyecto

```
ImportSmart/
├── backend/                                API REST (Java 17 + Spring Boot 3.2)
│   ├── src/main/java/com/importsmart/
│   │   ├── config/                         Seguridad (CORS, JWT), datos de demostracion
│   │   ├── controller/                     Endpoints REST
│   │   ├── dto/                            Objetos de transferencia
│   │   ├── exception/                      Manejo de errores
│   │   ├── model/                          Entidades JPA
│   │   ├── repository/                     Acceso a datos (Spring Data JPA)
│   │   ├── security/                       Autenticacion JWT
│   │   └── service/                        Logica de negocio y calculos
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
├── frontend/                               SPA (React + Vite)
│   └── src/
│       ├── api/                            Cliente HTTP y llamadas al backend
│       ├── assets/                         Imagenes, logo, iconos
│       ├── components/                     Navbar, Icon, ChatbotWidget...
│       ├── context/                        Sesion del usuario (AuthContext)
│       ├── pages/                          Pantallas: Login, Dashboard, Pedidos...
│       ├── styles/                         Estilos globales
│       └── utils/                          Funciones auxiliares
└── database/
    └── importsmart_schema.sql              Crea la base, tablas, usuario MySQL y datos de ejemplo
```

## 6. Fórmulas de negocio (CalculoService)

- Peso volumétrico (kg) = (largo x ancho x alto en cm) / 5000
- Peso facturable = máximo(peso real, peso volumétrico)
- Costo de envío = peso facturable total x tarifa por kg (según modalidad aérea/marítima)
- Utilidad = venta - (costo de productos + envío + gastos adicionales)
- Margen (%) = utilidad / venta x 100
- Semáforo de rentabilidad: margen >= 25% -> Rentable · 12%-25% -> Poco rentable ·
  menos de 12% -> No rentable

Los umbrales y el divisor volumétrico son configurables en application.properties.

## 7. APIs externas que consume

| API | Para qué | Requiere API key |
|---|---|---|
| open.er-api.com | Tipo de cambio USD a CRC/otras divisas | No |
| Google OAuth 2.0 | Iniciar sesión con Google | Sí (opcional) |
| Google Gemini | Respuestas del chatbot del landing | Sí (opcional) |

La API de tipo de cambio es la que satisface el requisito de "consumir al menos una API
externa y pública" del enunciado, y funciona sin ninguna configuración adicional.

## 8. Principales endpoints REST

| Método | Ruta | Descripción |
|---|---|---|
| POST | /api/auth/login | Inicio de sesión (devuelve JWT) |
| POST | /api/auth/register | Registro de cuenta nueva (rol Cliente) |
| GET | /api/auth/google/login | Redirige al login de Google |
| POST | /api/auth/forgot-password / /reset-password | Recuperación de contraseña |
| GET/POST/PUT/DELETE | /api/clientes | CRUD de empresas cliente |
| GET/POST/PUT/DELETE | /api/productos | CRUD de productos |
| GET | /api/categorias, /api/estados, /api/tarifas | Catálogos |
| GET/POST/PUT/DELETE | /api/pedidos | Pedidos (crea y recalcula todo) |
| PATCH | /api/pedidos/{id}/estado | Cambia el estado (registra línea de tiempo) |
| POST | /api/simulacion | Simulador de escenarios de envío |
| GET | /api/tipo-cambio | Tipo de cambio externo |
| GET | /api/cotizaciones/{id}/pdf-cliente y /pdf-interno | Cotización en PDF |
| GET | /api/dashboard/kpis | Indicadores del panel (solo Administrador) |
| POST | /api/chatbot | Pregunta al asistente del landing (público, sin login) |

Todas las rutas (excepto /api/auth/** y /api/chatbot) requieren el header
Authorization: Bearer <token>.

## 9. Antes de entregar (evita el cero por binarios)

El enunciado asigna cero si el ZIP incluye binarios como node_modules o carpetas de
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

Estas carpetas se regeneran solas con npm install y mvn spring-boot:run, así que no
hace falta incluirlas.

Como la entrega es por ZIP (no por git clone), si querés que el profesor también vea
funcionando el login con Google, la recuperación por correo o el chatbot con IA, podés
incluir tu backend/application-local.properties dentro del ZIP — a diferencia de un
repositorio Git, el ZIP no respeta .gitignore. Es opcional: sin ese archivo, el programa
funciona igual, solo esas tres funciones extra quedan desactivadas.

## 10. Solución de problemas

- El backend no conecta a MySQL: confirmá que el servicio MySQL esté encendido y que el
  script del Paso 1 se haya ejecutado completo (crea la base y el usuario importsmart).
- El frontend no trae datos / error 401: verificá que el backend esté corriendo en el
  puerto 8080 y volvé a iniciar sesión.
- El tipo de cambio aparece con "respaldo": no hay internet; el sistema sigue
  funcionando con el valor por defecto (app.tipocambio.fallback).
- No aparece el botón de Google / el chatbot responde con mensaje fijo: son funciones
  opcionales (ver sección 4) — el resto del sistema funciona igual sin configurarlas.

---

# SECCIÓN MANUAL DE USUARIO

## 1. ¿Qué es ImportSmart?

Es la plataforma web de una empresa importadora. Desde ahí:

- Los clientes piden cotizaciones y siguen el estado de sus importaciones.
- El equipo operativo gestiona la logística de cada pedido.
- La administración controla costos, utilidad y rentabilidad del negocio.

## 2. Cómo entrar

Al abrir http://localhost:5173 verás la página de inicio (landing), con información
del servicio, un asistente de chat con IA y un botón para iniciar sesión o
registrarte.

- Iniciar sesión: con correo y contraseña, o con el botón de Google (si está configurado).
- Registrarte: nombre, correo, teléfono y contraseña (mínimo 8 caracteres, con una
  mayúscula y un carácter especial). Tu cuenta queda automáticamente como Cliente.
- Olvidé mi contraseña: pedí un enlace de recuperación desde la pantalla de login.

## 3. Qué puede hacer cada tipo de usuario

| | Administrador | Operador | Cliente |
|---|:---:|:---:|:---:|
| Ver Dashboard (KPIs, gráficos) | Sí | No | No |
| Ver todos los pedidos | Sí | Sí | Solo los propios |
| Crear un pedido nuevo | Sí | No | Sí |
| Cambiar el estado de un pedido | Sí | Sí | No |
| Ver costos, utilidad y rentabilidad | Sí | No | No |
| Gestionar clientes (empresas) | Sí | No | No |
| Ver/gestionar productos | Sí | Solo ver | Solo ver |
| Usar el Simulador de escenarios | Sí | Sí | Sí (como "Cotizador") |
| Rastrear un pedido por su código | Sí | Sí | Sí |

Estos permisos se aplican en el backend (no solo se ocultan botones): un Operador nunca
recibe los montos financieros aunque intente consultarlos directamente.

## 4. Tour por las pantallas

- Inicio — Landing pública: qué ofrece ImportSmart, cómo funciona el proceso, y un
  asistente de chat que responde preguntas generales (tarifas, tiempos, cómo cotizar).
- Dashboard (solo Administrador) — Pedidos activos, utilidad y ventas acumuladas,
  gráfico de productos más rentables, semáforo de rentabilidad y el tipo de cambio del día.
- Pedidos / Mis pedidos — Lista de pedidos con su modalidad de envío, estado y (según tu
  rol) venta/utilidad/rentabilidad. Al abrir un pedido ves productos, paquetes, pesos
  (real/volumétrico/facturable), la línea de tiempo de estados, y podés descargar la
  cotización en PDF. También hay un buscador para rastrear un pedido por su código.
- Nuevo pedido / Crear pedido — Elegís la empresa (o sos vos mismo si sos Cliente), la
  modalidad de envío, agregás productos y paquetes (dimensiones + peso). El sistema
  calcula en vivo el peso volumétrico, el costo de envío, la utilidad y la rentabilidad.
- Simulador / Cotizador — Compara aéreo vs. marítimo (costo, tiempo, utilidad) y
  empaque consolidado vs. separado, recomendando la mejor opción antes de comprar.
- Clientes (solo Administrador) — Alta, edición y borrado de las empresas cliente.
- Productos — Catálogo con costo, precio de venta, peso y dimensiones. El borrado es
  lógico (desactiva el producto) para no afectar pedidos ya existentes.

## 5. Sobre el tipo de cambio

Los montos se pueden ver en dólares, colones u otras divisas gracias a una API pública de
tipo de cambio que se actualiza automáticamente una vez al día. Si en algún momento no hay
conexión a internet, el sistema sigue funcionando con el último valor conocido.

## 6. ¿Algo no funciona?

Si algo no responde como esperás usando la plataforma ya instalada, revisá la sección
"Solución de problemas" dentro de la parte técnica de este mismo documento (punto 10).
