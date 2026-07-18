# ImportSmart

**Plataforma inteligente para cotizar, planificar y controlar importaciones.**

ImportSmart es un sistema web que permite registrar empresas cliente, productos, pedidos y
paquetes de importación, y **calcula automáticamente** el peso volumétrico, el costo real de
envío, la utilidad estimada y la rentabilidad de cada pedido. Además simula escenarios de
envío (aéreo vs. marítimo, empaque consolidado vs. separado) y consume una **API pública
externa de tipo de cambio** para convertir montos entre dólares y colones.

Su valor comercial: ayuda a un importador a **tomar mejores decisiones antes de comprar**
(qué modalidad conviene, cómo empacar, a qué precio vender para ser rentable), evitando
compras que parecen buenas pero pierden dinero por el flete.

---

## Integrantes

| Nombre | Carné / Rol |
|--------|-------------|
| Sebastián | Desarrollo full-stack |
| _(agregar integrantes si es grupal)_ | |

> Curso: **Programación Web** · Universidad Latina · Proyecto (30 %).

---

## 1. Arquitectura y cumplimiento del enunciado

| Requisito del enunciado | Cómo lo cumple ImportSmart |
|---|---|
| Lenguaje/framework distinto en front y back | **Front-end:** JavaScript + React (Vite). **Back-end:** Java + Spring Boot. |
| Base de datos (relacional o no) | **MySQL 8** (relacional), esquema en `database/importsmart_schema.sql`. |
| No usar frameworks full-stack (.NET, Laravel, Next.js…) | Front y back son **proyectos separados e independientes** que se comunican por API REST. |
| Consumir al menos una API pública externa | **API de tipo de cambio** `open.er-api.com` (USD → CRC), sin API key. Ver RF-09. |
| README como manual técnico y de usuario | Este documento. |

```
┌─────────────────────┐        HTTP/REST + JWT        ┌──────────────────────┐        JDBC        ┌────────────┐
│  Frontend React     │  ───────────────────────────▶ │  Backend Spring Boot │  ────────────────▶ │  MySQL 8   │
│  (Vite, puerto 5173)│ ◀───────────────────────────  │  (puerto 8080)       │ ◀────────────────  │ importsmart│
└─────────────────────┘                                └──────────┬───────────┘                    └────────────┘
                                                                   │  HTTPS
                                                                   ▼
                                                        API externa de tipo de cambio
                                                        (open.er-api.com)
```

---

## 2. Requisitos previos

Instalar antes de ejecutar:

- **Java JDK 17 o superior** (Spring Boot 3.2 lo requiere).
- **Apache Maven 3.9+** (o usar el importador de Maven de tu IDE: IntelliJ / Eclipse / VS Code).
- **Node.js 18 o superior** (incluye `npm`).
- **MySQL 8** (o MariaDB 10.4+) corriendo en `localhost:3306`.

Verificación rápida:

```bash
java -version     # 17+
mvn -version      # 3.9+
node -v           # 18+
mysql --version   # 8+
```

---

## 3. Cómo ejecutar el proyecto (paso a paso)

### Paso 1 — Crear la base de datos

El script crea la base `importsmart`, todas las tablas y **datos ficticios** de ejemplo
(empresas, productos, 16 pedidos con su historial).

```bash
# Desde la carpeta del proyecto:
mysql -u root -p < database/importsmart_schema.sql
```

> También puedes abrir `database/importsmart_schema.sql` en MySQL Workbench y ejecutarlo con el rayo ⚡.

### Paso 2 — Configurar y levantar el backend

1. Crea tu configuracion local de MySQL sin subir contraseñas a Git. Copia:

   ```bash
   backend/application-local.example.properties
   ```

   como:

   ```bash
   backend/application-local.properties
   ```

   y coloca **tu usuario y contraseña de MySQL**:

   ```properties
   spring.datasource.username=root
   spring.datasource.password=TU_PASSWORD_DE_MYSQL
   ```

   > `application-local.properties` esta ignorado por Git. Cada computadora puede tener su propia contraseña.

2. Levanta el backend:

   ```bash
   cd backend
   mvn spring-boot:run
   ```

   El backend queda escuchando en **http://localhost:8080**.
   (Alternativa: abrir la carpeta `backend` en tu IDE y ejecutar la clase `ImportSmartApplication`.)

### Paso 3 — Levantar el frontend

En **otra terminal**:

```bash
cd frontend
npm install
npm run dev
```

Abre el navegador en **http://localhost:5173**.

> El frontend usa `http://localhost:8080/api` por defecto. Para cambiarlo, crea un archivo
> `frontend/.env` con `VITE_API_URL=http://localhost:8080/api` (ver `.env.example`).

### Paso 4 — Iniciar sesión

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin@importsmart.com` | `admin123` | Administrador |
| `operador@importsmart.com` | `operador123` | Operador |

---

## 4. Manual de usuario

Tras iniciar sesión, la barra superior da acceso a las secciones:

- **Dashboard** — Panel de resultados (RF-15): pedidos activos, utilidad total, ventas y
  costos acumulados, gráfico de productos más rentables y semáforo de rentabilidad. En la
  esquina se muestra el tipo de cambio USD→CRC en vivo.
- **Pedidos** — Lista de pedidos con su modalidad de envío, estado, venta, utilidad y
  **semáforo de rentabilidad**. Al hacer clic en un pedido se abre el detalle con:
  productos, paquetes y pesos (real/volumétrico/facturable), totales, **línea de tiempo**
  de estados y un botón para **descargar la cotización en PDF**. Ahí mismo se cambia el estado.
- **Nuevo pedido** — Formulario para crear un pedido: se elige la empresa, la modalidad de
  envío, se agregan productos (cantidad) y paquetes (dimensiones + peso real). El sistema
  **calcula en vivo** el peso volumétrico, el costo de envío, la utilidad y la rentabilidad.
- **Simulador** — Compara **aéreo vs. marítimo** (costo, tiempo y utilidad) y **empaque
  consolidado vs. separado**, y recomienda la mejor opción antes de comprar.
- **Clientes** — Alta, edición y borrado de las empresas cliente.
- **Productos** — Catálogo con costo, precio de venta, peso y dimensiones (base del cálculo
  volumétrico). El borrado es lógico (desactiva el producto) para no afectar pedidos previos.

### Roles y permisos

El sistema tiene dos roles con permisos distintos:

- **Administrador** — Acceso total: ve el Dashboard, crea/edita/borra clientes, productos y
  pedidos, cambia estados, descarga cotizaciones y ve toda la información financiera
  (costos, utilidad, rentabilidad).
- **Operador** — **Solo lectura y sin información sensible.** No ve el Dashboard ni la pantalla
  de Nuevo pedido, no puede crear/editar/borrar nada, y no ve costos, utilidades,
  rentabilidad ni cotizaciones. Su vista de Pedidos es de **seguimiento logístico**
  (código, cliente, modalidad, estado, fecha, productos, pesos y línea de tiempo).

Estos permisos se aplican **en el backend** (Spring Security por rol) y además se reflejan en
la interfaz (se ocultan botones y columnas). Los formularios de Clientes y Productos validan
que todos los campos estén llenos, que el teléfono sea numérico, que el email tenga `@` y
dominio, y que las cantidades sean mayores a 0.

### Tipo de cambio (RF-09)

El tipo de cambio USD→CRC se toma de la API pública **open.er-api.com** (alimentada por bancos
centrales, se actualiza cada 24 h). ImportSmart lo **guarda en caché durante el día** (una sola
consulta diaria) y lo **refresca automáticamente cada día a las 6:00 a.m.** mediante una tarea
programada. Si la API no responde, conserva el último valor bueno o usa un respaldo configurable.

---

## 5. Manual técnico

### 5.1 Estructura del proyecto

```
Proyectown/
├── database/
│   └── importsmart_schema.sql      # Esquema MySQL + datos ficticios
├── backend/                        # API REST (Java 17 + Spring Boot 3.2)
│   ├── pom.xml
│   └── src/main/java/com/importsmart/
│       ├── model/                  # Entidades JPA
│       ├── repository/             # Spring Data JPA
│       ├── dto/                    # Objetos de transferencia
│       ├── service/                # Lógica de negocio y cálculos
│       ├── controller/             # Endpoints REST
│       ├── security/ + config/     # Autenticación JWT
│       └── ImportSmartApplication.java
└── frontend/                       # SPA (React + Vite)
    └── src/
        ├── api/                    # Cliente axios + endpoints
        ├── pages/                  # Dashboard, Pedidos, NuevoPedido, Simulador, Clientes, Productos
        ├── components/ context/    # Navbar, Icon, AuthContext…
        └── styles/theme.css
```

### 5.2 Fórmulas de negocio (`CalculoService`)

- **Peso volumétrico (kg)** = `(largo × ancho × alto en cm) / 5000`  *(RF-06)*
- **Peso facturable** = `máximo(peso real, peso volumétrico)`  *(RF-07)*
- **Costo de envío** = `peso facturable total × tarifa por kg` (según modalidad)  *(RF-07)*
- **Utilidad** = `venta − (costo de productos + envío + gastos adicionales)`  *(RF-08)*
- **Margen (%)** = `utilidad / venta × 100`
- **Semáforo de rentabilidad** *(RF-12)*: `margen ≥ 25%` → **Rentable**;
  `12% ≤ margen < 25%` → **Poco rentable**; `margen < 12%` → **No rentable**.

Los umbrales y el divisor volumétrico son configurables en `application.properties`.

### 5.3 API externa de tipo de cambio (RF-09)

`TipoCambioService` consulta `https://open.er-api.com/v6/latest/USD` (gratuita, sin API key)
y usa `rates.CRC`. Si la API no responde, usa un valor de respaldo configurable para que el
sistema siga funcionando. Endpoints: `GET /api/tipo-cambio` y `GET /api/tipo-cambio/convertir?usd=100`.

### 5.4 Principales endpoints REST

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Inicio de sesión (devuelve JWT) |
| GET/POST/PUT/DELETE | `/api/clientes` | CRUD de empresas cliente |
| GET/POST/PUT/DELETE | `/api/productos` | CRUD de productos |
| GET | `/api/categorias`, `/api/estados`, `/api/tarifas` | Catálogos |
| GET/POST/PUT/DELETE | `/api/pedidos` | Pedidos (crea y recalcula todo) |
| PATCH | `/api/pedidos/{id}/estado` | Cambia el estado (registra timeline) |
| POST | `/api/simulacion` | Simulador de escenarios |
| GET | `/api/tipo-cambio` | Tipo de cambio externo |
| GET | `/api/cotizaciones/{id}/pdf` | Cotización en PDF |
| GET | `/api/dashboard/kpis` | Indicadores del panel |

Todas las rutas (excepto `/api/auth/**`) requieren el header `Authorization: Bearer <token>`.

### 5.5 Mapa de requerimientos funcionales

| RF | Dónde se cumple |
|---|---|
| RF-01 Login | `AuthController` + pantalla Login (JWT) |
| RF-02 Clientes | `ClienteController` + pantalla Clientes |
| RF-03 Productos (peso/dimensiones) | `ProductoController` + pantalla Productos |
| RF-04 Pedidos con 1+ productos | `PedidoService` + Nuevo pedido |
| RF-05 Paquetes (alto/ancho/largo/peso) | Entidad `Paquete` + Nuevo pedido |
| RF-06 Peso volumétrico | `CalculoService.pesoVolumetrico` |
| RF-07 Costo de envío (mayor peso) | `CalculoService.pesoFacturable` + `costoEnvio` |
| RF-08 Utilidad | `CalculoService.utilidad` |
| RF-09 Conversión de moneda (API externa) | `TipoCambioService` |
| RF-10 Simulación de escenarios | `SimulacionService` + Simulador |
| RF-11 Comparación aéreo/marítimo | `SimulacionService.comparacionModalidad` |
| RF-12 Semáforo de rentabilidad | `CalculoService.clasificar` |
| RF-13 Estados del pedido | `PedidoService.cambiarEstado` |
| RF-14 Timeline del pedido | `HistorialEstado` + detalle del pedido |
| RF-15 Dashboard | `DashboardService` + Dashboard |
| RF-16 Cotización | `CotizacionService` (PDF) |

---

## 6. Antes de entregar (evita el cero por binarios)

El enunciado asigna **cero** si el ZIP incluye binarios como `node_modules` o carpetas de
compilación. Antes de comprimir, elimina:

```
frontend/node_modules
frontend/dist
backend/target
```

En Windows puedes borrarlos desde el Explorador, o por consola:

```bat
rmdir /s /q frontend\node_modules
rmdir /s /q frontend\dist
rmdir /s /q backend\target
```

Estas carpetas se regeneran solas con `npm install` y `mvn spring-boot:run`.

---

## 7. Solución de problemas

- **El backend no conecta a MySQL:** revisa usuario/contraseña en `backend/application-local.properties` y
  que el servicio MySQL esté encendido y la base `importsmart` creada (Paso 1).
- **El frontend no trae datos / error 401:** verifica que el backend esté en el puerto 8080
  y vuelve a iniciar sesión.
- **El tipo de cambio aparece con "respaldo":** no hay internet; el sistema sigue funcionando
  con el valor por defecto (`app.tipocambio.fallback`).
