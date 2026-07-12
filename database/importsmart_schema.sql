-- ===========================================================================
--  ImportSmart - Esquema MySQL + datos ficticios (proyecto Programacion Web)
--  Motor: MySQL 8 / MariaDB 10.4+   |   Charset: utf8mb4
--  Ejecutar:  mysql -u root -p < importsmart_schema.sql
--  Este archivo CREA la base 'importsmart', las tablas y carga datos de ejemplo.
-- ===========================================================================

DROP DATABASE IF EXISTS importsmart;
CREATE DATABASE importsmart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE importsmart;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  rol           VARCHAR(20)   NOT NULL,
  activo        TINYINT(1)    NOT NULL DEFAULT 1,
  creado_en     DATETIME      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE clientes (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  numero_cliente VARCHAR(20)  NOT NULL UNIQUE,
  nombre         VARCHAR(150) NOT NULL,
  contacto       VARCHAR(120),
  email          VARCHAR(150),
  telefono       VARCHAR(30),
  pais           VARCHAR(60),
  direccion      VARCHAR(255),
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_clientes_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE categorias (
  id     BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE productos (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  categoria_id   BIGINT,
  nombre         VARCHAR(200) NOT NULL,
  descripcion    VARCHAR(400),
  costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,   -- en USD
  precio_venta   DECIMAL(12,2) NOT NULL DEFAULT 0,   -- en USD
  peso_kg        DECIMAL(10,2) NOT NULL DEFAULT 0,
  largo_cm       DECIMAL(10,2) NOT NULL DEFAULT 0,
  ancho_cm       DECIMAL(10,2) NOT NULL DEFAULT 0,
  alto_cm        DECIMAL(10,2) NOT NULL DEFAULT 0,
  link_proveedor VARCHAR(500),
  activo         TINYINT(1) NOT NULL DEFAULT 1,
  CONSTRAINT fk_prod_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  INDEX idx_productos_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE tarifas_envio (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  tipo             VARCHAR(20) NOT NULL UNIQUE,       -- AEREO | MARITIMO
  costo_por_kg_usd DECIMAL(10,2) NOT NULL,
  dias_estimados   INT NOT NULL,
  descripcion      VARCHAR(300)
) ENGINE=InnoDB;

CREATE TABLE estados_pedido (
  id     BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  orden  INT NOT NULL DEFAULT 0,
  color  VARCHAR(20)
) ENGINE=InnoDB;

CREATE TABLE pedidos (
  id                     BIGINT AUTO_INCREMENT PRIMARY KEY,
  codigo                 VARCHAR(30) NOT NULL UNIQUE,
  cliente_id             BIGINT,
  descripcion            VARCHAR(400),
  tipo_envio             VARCHAR(20) NOT NULL DEFAULT 'AEREO',
  estado_pedido_id       BIGINT,
  tipo_cambio            DECIMAL(12,4),               -- CRC por USD (snapshot)
  subtotal_productos     DECIMAL(12,2) NOT NULL DEFAULT 0,
  costo_envio            DECIMAL(12,2) NOT NULL DEFAULT 0,
  gastos_adicionales     DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_venta            DECIMAL(12,2) NOT NULL DEFAULT 0,
  utilidad               DECIMAL(12,2) NOT NULL DEFAULT 0,
  margen_pct             DECIMAL(6,2)  NOT NULL DEFAULT 0,
  rentabilidad           VARCHAR(20)   NOT NULL DEFAULT 'NO_RENTABLE',
  peso_real_total        DECIMAL(10,2) NOT NULL DEFAULT 0,
  peso_volumetrico_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  peso_facturable_total  DECIMAL(10,2) NOT NULL DEFAULT 0,
  fecha_pedido           DATE,
  creado_en              DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  CONSTRAINT fk_pedido_estado  FOREIGN KEY (estado_pedido_id) REFERENCES estados_pedido(id),
  INDEX idx_pedidos_cliente (cliente_id),
  INDEX idx_pedidos_estado (estado_pedido_id)
) ENGINE=InnoDB;

CREATE TABLE pedido_items (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  pedido_id      BIGINT NOT NULL,
  producto_id    BIGINT NOT NULL,
  cantidad       INT NOT NULL DEFAULT 1,
  costo_unitario DECIMAL(12,2) NOT NULL DEFAULT 0,
  precio_venta   DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_item_pedido   FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
) ENGINE=InnoDB;

CREATE TABLE paquetes (
  id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
  pedido_id           BIGINT NOT NULL,
  descripcion         VARCHAR(120),
  largo_cm            DECIMAL(10,2) NOT NULL DEFAULT 0,
  ancho_cm            DECIMAL(10,2) NOT NULL DEFAULT 0,
  alto_cm             DECIMAL(10,2) NOT NULL DEFAULT 0,
  peso_real_kg        DECIMAL(10,2) NOT NULL DEFAULT 0,
  peso_volumetrico_kg DECIMAL(10,2) NOT NULL DEFAULT 0,
  peso_facturable_kg  DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_paquete_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE historial_estados (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  pedido_id     BIGINT NOT NULL,
  estado_nombre VARCHAR(50) NOT NULL,
  nota          VARCHAR(255),
  fecha         DATE NOT NULL,
  CONSTRAINT fk_hist_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- Datos: usuarios (contrasenas mostradas abajo, guardadas con hash BCrypt)
--   admin@importsmart.com    / admin123      (rol ADMINISTRADOR)
--   operador@importsmart.com / operador123   (rol OPERADOR)
-- ---------------------------------------------------------------------------
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
('Administrador ImportSmart', 'admin@importsmart.com', '$2b$10$vCdst3V/Gv6DnSUth4dx/O41XkIfogJuetJHaMsmOpdc8LIKxqa8.', 'ADMINISTRADOR', 1),
('Operador ImportSmart', 'operador@importsmart.com', '$2b$10$oR0N.ooZxWpiZChUUz7IZ.R3Jw9dcz2ixjgOKMowVbOd88YZ5Mmqy', 'OPERADOR', 1);

INSERT INTO categorias (nombre) VALUES
('Electronica'),
('Hogar y cocina'),
('Repuestos automotrices'),
('Herramientas'),
('Belleza y cuidado personal'),
('Deportes y fitness');

INSERT INTO tarifas_envio (tipo, costo_por_kg_usd, dias_estimados, descripcion) VALUES
('AEREO', 12.5, 6, 'Envio aereo express: mas rapido, ideal para carga liviana o urgente.'),
('MARITIMO', 3.2, 35, 'Envio maritimo consolidado: mas economico, ideal para carga voluminosa.');

INSERT INTO estados_pedido (nombre, orden, color) VALUES
('Cotizado', 1, '#5b6b7a'),
('Aprobado', 2, '#0c6291'),
('Comprado', 3, '#14b8c4'),
('En bodega', 4, '#8b5cf6'),
('En transito', 5, '#f59e0b'),
('En aduana', 6, '#d97706'),
('Entregado', 7, '#12a37a');

INSERT INTO clientes (numero_cliente, nombre, contacto, email, telefono, pais, direccion) VALUES
('CL0001', 'TecnoAndes S.A.', 'Marcela Vargas', 'compras@tecnoandes.co.cr', '2258-4471', 'Costa Rica', 'San Jose, Escazu, Plaza Tempo, local 14'),
('CL0002', 'Importadora del Valle', 'Luis Jimenez', 'luis@impvalle.com', '2431-9902', 'Costa Rica', 'Alajuela centro, 200m norte del parque'),
('CL0003', 'Global Parts CR', 'Andrea Mora', 'ventas@globalpartscr.com', '2289-3310', 'Costa Rica', 'Heredia, San Francisco, Zona Franca Ultrapark'),
('CL0004', 'Casa Bonita Home', 'Roberto Soto', 'info@casabonitahome.com', '2666-1187', 'Costa Rica', 'Liberia, Guanacaste, Av. Central'),
('CL0005', 'AutoRepuestos Pacifico', 'Diego Herrera', 'diego@autopacifico.cr', '2777-4520', 'Costa Rica', 'Quepos, Puntarenas, frente al mercado'),
('CL0006', 'NovaTech Solutions', 'Karla Ramirez', 'karla@novatech.cr', '4000-2281', 'Costa Rica', 'San Jose, Sabana Sur, Torre Mercedes'),
('CL0007', 'Distribuidora El Sol', 'Fernando Castro', 'compras@elsol.co.cr', '2245-7788', 'Costa Rica', 'Cartago centro, Av. 2'),
('CL0008', 'BellezaViva Cosmeticos', 'Paola Nunez', 'paola@bellezaviva.com', '2101-6644', 'Costa Rica', 'San Jose, Curridabat, Plaza del Sol'),
('CL0009', 'FitZone Equipos', 'Esteban Rojas', 'ventas@fitzone.cr', '2560-9033', 'Costa Rica', 'San Ramon, Alajuela, ruta 1'),
('CL0010', 'Comercial Delta', 'Gabriela Leon', 'gabriela@comercialdelta.com', '2222-1090', 'Panama', 'Ciudad de Panama, Costa del Este'),
('CL0011', 'MegaHogar Import', 'Andres Salas', 'andres@megahogar.cr', '2434-2200', 'Costa Rica', 'Grecia, Alajuela, centro'),
('CL0012', 'Suplidora Continental', 'Monica Fuentes', 'monica@continental.ni', '505-2278-4400', 'Nicaragua', 'Managua, Carretera Masaya km 5');

INSERT INTO productos (categoria_id, nombre, descripcion, costo_unitario, precio_venta, peso_kg, largo_cm, ancho_cm, alto_cm, link_proveedor) VALUES
(1, 'Audifonos Bluetooth ANC X200', 'Audifonos inalambricos con cancelacion de ruido', 18.0, 39.0, 0.3, 20, 18, 8, 'https://proveedor.example.com/x200'),
(1, 'Smartwatch FitPro S8', 'Reloj inteligente con GPS y monitor cardiaco', 26.5, 55.0, 0.25, 14, 12, 7, 'https://proveedor.example.com/s8'),
(1, 'Parlante portatil BoomMax', 'Parlante Bluetooth resistente al agua 30W', 22.0, 46.0, 0.85, 24, 12, 12, 'https://proveedor.example.com/boommax'),
(1, 'Camara de seguridad WiFi 2K', 'Camara IP interior con vision nocturna', 15.75, 34.0, 0.4, 12, 12, 12, 'https://proveedor.example.com/cam2k'),
(2, 'Licuadora PowerBlend 1200W', 'Licuadora de vaso de vidrio 1.5L', 34.0, 68.0, 3.2, 40, 25, 35, 'https://proveedor.example.com/blend1200'),
(2, 'Set de ollas antiadherentes 10pz', 'Juego de ollas y sartenes con recubrimiento ceramico', 48.0, 95.0, 6.1, 45, 40, 28, 'https://proveedor.example.com/ollas10'),
(2, 'Cafetera Espresso CremaPro', 'Cafetera espresso 15 bar con espumador', 55.0, 108.0, 4.3, 34, 30, 32, 'https://proveedor.example.com/cremapro'),
(2, 'Freidora de aire 5.5L AirCook', 'Freidora de aire digital sin aceite', 42.0, 84.0, 5.0, 33, 33, 35, 'https://proveedor.example.com/aircook'),
(3, 'Kit de frenos delanteros ProStop', 'Pastillas y discos de freno para sedan', 39.0, 78.0, 4.5, 32, 30, 18, 'https://proveedor.example.com/prostop'),
(3, 'Bateria automotriz 12V 60Ah', 'Bateria libre de mantenimiento', 68.0, 120.0, 14.5, 26, 18, 20, 'https://proveedor.example.com/bat60'),
(3, 'Juego de amortiguadores RoadX', 'Par de amortiguadores traseros', 44.0, 89.0, 6.8, 60, 15, 15, 'https://proveedor.example.com/roadx'),
(4, 'Taladro inalambrico 20V MaxDrill', 'Taladro atornillador con 2 baterias', 33.0, 69.0, 2.1, 35, 28, 12, 'https://proveedor.example.com/maxdrill'),
(4, 'Set de herramientas 108 piezas', 'Maletin de herramientas para hogar y taller', 29.5, 62.0, 5.4, 42, 32, 10, 'https://proveedor.example.com/set108'),
(4, 'Esmeriladora angular 750W', 'Amoladora de 4.5 pulgadas', 24.0, 51.0, 2.0, 32, 12, 12, 'https://proveedor.example.com/esm750'),
(5, 'Set de brochas de maquillaje 15pz', 'Juego de brochas profesionales con estuche', 8.5, 22.0, 0.35, 22, 12, 5, 'https://proveedor.example.com/brochas15'),
(5, 'Secadora de cabello IonPro 2200W', 'Secadora ionica profesional', 19.0, 42.0, 0.9, 28, 24, 11, 'https://proveedor.example.com/ionpro'),
(5, 'Plancha de cabello TitanX', 'Plancha de titanio con control digital', 16.5, 38.0, 0.55, 30, 8, 6, 'https://proveedor.example.com/titanx'),
(6, 'Mancuernas ajustables 24kg', 'Par de mancuernas ajustables 2.5-24kg', 89.0, 165.0, 24.0, 40, 20, 20, 'https://proveedor.example.com/mancuernas24'),
(6, 'Bicicleta estatica SpinPro', 'Bicicleta de spinning con volante de inercia', 135.0, 245.0, 22.0, 100, 50, 110, 'https://proveedor.example.com/spinpro'),
(6, 'Colchoneta yoga premium', 'Mat de yoga antideslizante 6mm', 7.0, 19.0, 1.1, 61, 15, 15, 'https://proveedor.example.com/yogamat');

INSERT INTO pedidos (id, codigo, cliente_id, descripcion, tipo_envio, estado_pedido_id, tipo_cambio, subtotal_productos, costo_envio, gastos_adicionales, total_venta, utilidad, margen_pct, rentabilidad, peso_real_total, peso_volumetrico_total, peso_facturable_total, fecha_pedido) VALUES
(1, 'IMP-20260001', 2, 'Plancha de cabello TitanX, Colchoneta yoga premium', 'AEREO', 5, 512.35, 37.5, 179.38, 23.56, 322.18, 81.74, 25.37, 'RENTABLE', 3.85, 14.35, 14.35, '2026-05-08'),
(2, 'IMP-20260002', 2, 'Bateria automotriz 12V 60Ah', 'AEREO', 6, 512.35, 136.0, 362.5, 40.97, 690.52, 151.05, 21.87, 'POCO_RENTABLE', 29.0, 5.82, 29.0, '2026-05-30'),
(3, 'IMP-20260003', 12, 'Parlante portatil BoomMax, Juego de amortiguadores RoadX, Colchoneta yoga premium', 'MARITIMO', 1, 512.35, 139.0, 66.05, 34.51, 287.48, 47.92, 16.67, 'POCO_RENTABLE', 16.4, 20.64, 20.64, '2026-05-23'),
(4, 'IMP-20260004', 8, 'Parlante portatil BoomMax, Set de herramientas 108 piezas', 'MARITIMO', 4, 512.35, 81.0, 39.33, 35.76, 209.17, 53.08, 25.38, 'RENTABLE', 11.65, 12.29, 12.29, '2026-05-20'),
(5, 'IMP-20260005', 8, 'Plancha de cabello TitanX, Audifonos Bluetooth ANC X200, Freidora de aire 5.5L AirCook', 'AEREO', 4, 512.35, 196.5, 472.5, 34.54, 900.53, 196.99, 21.87, 'POCO_RENTABLE', 16.45, 37.8, 37.8, '2026-06-21'),
(6, 'IMP-20260006', 11, 'Mancuernas ajustables 24kg, Kit de frenos delanteros ProStop', 'MARITIMO', 4, 512.35, 345.0, 259.2, 31.93, 903.31, 267.18, 29.58, 'RENTABLE', 81.0, 33.56, 81.0, '2026-05-19'),
(7, 'IMP-20260007', 1, 'Licuadora PowerBlend 1200W', 'MARITIMO', 6, 512.35, 102.0, 87.71, 42.1, 278.16, 46.35, 16.66, 'POCO_RENTABLE', 9.6, 27.41, 27.41, '2026-05-08'),
(8, 'IMP-20260008', 5, 'Set de brochas de maquillaje 15pz, Camara de seguridad WiFi 2K', 'MARITIMO', 4, 512.35, 72.75, 17.63, 17.58, 123.06, 15.1, 12.27, 'POCO_RENTABLE', 2.25, 5.51, 5.51, '2026-05-09'),
(9, 'IMP-20260009', 2, 'Esmeriladora angular 750W', 'AEREO', 5, 512.35, 48.0, 50.0, 8.01, 142.06, 36.05, 25.38, 'RENTABLE', 4.0, 2.28, 4.0, '2026-06-29'),
(10, 'IMP-20260010', 1, 'Kit de frenos delanteros ProStop, Taladro inalambrico 20V MaxDrill, Licuadora PowerBlend 1200W', 'AEREO', 4, 512.35, 279.0, 773.5, 42.27, 1620.25, 525.48, 32.43, 'RENTABLE', 24.9, 61.88, 61.88, '2026-04-12'),
(11, 'IMP-20260011', 10, 'Colchoneta yoga premium', 'MARITIMO', 7, 512.35, 7.0, 13.95, 13.92, 39.75, 4.88, 12.28, 'POCO_RENTABLE', 1.1, 4.36, 4.36, '2026-04-25'),
(12, 'IMP-20260012', 7, 'Camara de seguridad WiFi 2K', 'MARITIMO', 7, 512.35, 15.75, 2.14, 20.84, 46.48, 7.75, 16.67, 'POCO_RENTABLE', 0.4, 0.67, 0.67, '2026-07-06'),
(13, 'IMP-20260013', 2, 'Set de brochas de maquillaje 15pz, Bicicleta estatica SpinPro', 'AEREO', 4, 512.35, 413.5, 4705.12, 24.04, 6171.2, 1028.54, 16.67, 'POCO_RENTABLE', 66.35, 376.41, 376.41, '2026-04-24'),
(14, 'IMP-20260014', 1, 'Set de ollas antiadherentes 10pz', 'AEREO', 7, 512.35, 144.0, 514.12, 9.78, 988.5, 320.6, 32.43, 'RENTABLE', 18.3, 41.13, 41.13, '2026-04-18'),
(15, 'IMP-20260015', 3, 'Set de ollas antiadherentes 10pz', 'MARITIMO', 4, 512.35, 96.0, 82.43, 23.32, 217.9, 16.15, 7.41, 'NO_RENTABLE', 12.2, 25.76, 25.76, '2026-05-31'),
(16, 'IMP-20260016', 8, 'Esmeriladora angular 750W, Bateria automotriz 12V 60Ah', 'MARITIMO', 7, 512.35, 160.0, 99.2, 24.45, 380.09, 96.44, 25.37, 'RENTABLE', 31.0, 9.09, 31.0, '2026-05-03');

INSERT INTO pedido_items (pedido_id, producto_id, cantidad, costo_unitario, precio_venta) VALUES
(1, 17, 1, 16.5, 141.76),
(1, 20, 3, 7.0, 60.14),
(2, 10, 2, 68.0, 345.26),
(3, 3, 2, 22.0, 45.5),
(3, 11, 2, 44.0, 91.0),
(3, 20, 1, 7.0, 14.48),
(4, 3, 1, 22.0, 56.81),
(4, 13, 2, 29.5, 76.18),
(5, 17, 1, 16.5, 75.62),
(5, 1, 3, 18.0, 82.49),
(5, 8, 3, 42.0, 192.48),
(6, 18, 3, 89.0, 233.03),
(6, 9, 2, 39.0, 102.11),
(7, 5, 3, 34.0, 92.72),
(8, 15, 3, 8.5, 14.38),
(8, 4, 3, 15.75, 26.64),
(9, 14, 2, 24.0, 71.03),
(10, 9, 2, 39.0, 226.49),
(10, 12, 3, 33.0, 191.64),
(10, 5, 3, 34.0, 197.45),
(11, 20, 1, 7.0, 39.75),
(12, 4, 1, 15.75, 46.48),
(13, 15, 1, 8.5, 126.86),
(13, 19, 3, 135.0, 2014.78),
(14, 6, 3, 48.0, 329.5),
(15, 6, 2, 48.0, 108.95),
(16, 14, 1, 24.0, 57.01),
(16, 10, 2, 68.0, 161.54);

INSERT INTO paquetes (pedido_id, descripcion, largo_cm, ancho_cm, alto_cm, peso_real_kg, peso_volumetrico_kg, peso_facturable_kg) VALUES
(1, 'Caja consolidada 1', 67, 21, 51, 3.85, 14.35, 14.35),
(2, 'Caja consolidada 1', 28, 26, 40, 29.0, 5.82, 29.0),
(3, 'Caja consolidada 1', 68, 22, 69, 16.4, 20.64, 20.64),
(4, 'Caja consolidada 1', 48, 40, 32, 11.65, 12.29, 12.29),
(5, 'Caja consolidada 1', 40, 35, 135, 16.45, 37.8, 37.8),
(6, 'Caja consolidada 1', 46, 38, 96, 81.0, 33.56, 81.0),
(7, 'Caja consolidada 1', 45, 29, 105, 9.6, 27.41, 27.41),
(8, 'Caja consolidada 1', 30, 18, 51, 2.25, 5.51, 5.51),
(9, 'Caja consolidada 1', 34, 14, 24, 4.0, 2.28, 4.0),
(10, 'Caja consolidada 1', 46, 38, 177, 24.9, 61.88, 61.88),
(11, 'Caja consolidada 1', 66, 22, 15, 1.1, 4.36, 4.36),
(12, 'Caja consolidada 1', 14, 20, 12, 0.4, 0.67, 0.67),
(13, 'Caja consolidada 1', 106, 53, 335, 66.35, 376.41, 376.41),
(14, 'Caja consolidada 1', 51, 48, 84, 18.3, 41.13, 41.13),
(15, 'Caja consolidada 1', 50, 46, 56, 12.2, 25.76, 25.76),
(16, 'Caja consolidada 1', 38, 23, 52, 31.0, 9.09, 31.0);

INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha) VALUES
(1, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-08'),
(1, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-13'),
(1, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-14'),
(1, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-14'),
(1, 'En transito', 'Pedido paso a estado En transito', '2026-06-01'),
(2, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-30'),
(2, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-06-04'),
(2, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-07'),
(2, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-11'),
(2, 'En transito', 'Pedido paso a estado En transito', '2026-06-15'),
(2, 'En aduana', 'Pedido paso a estado En aduana', '2026-06-24'),
(3, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-23'),
(4, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-20'),
(4, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-24'),
(4, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-30'),
(4, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-07'),
(5, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-06-21'),
(5, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-06-24'),
(5, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-25'),
(5, 'En bodega', 'Pedido paso a estado En bodega', '2026-07-06'),
(6, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-19'),
(6, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-22'),
(6, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-27'),
(6, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-31'),
(7, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-08'),
(7, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-14'),
(7, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-18'),
(7, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-23'),
(7, 'En transito', 'Pedido paso a estado En transito', '2026-06-01'),
(7, 'En aduana', 'Pedido paso a estado En aduana', '2026-05-18'),
(8, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-09'),
(8, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-13'),
(8, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-19'),
(8, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-21'),
(9, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-06-29'),
(9, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-07-02'),
(9, 'Comprado', 'Pedido paso a estado Comprado', '2026-07-05'),
(9, 'En bodega', 'Pedido paso a estado En bodega', '2026-07-05'),
(9, 'En transito', 'Pedido paso a estado En transito', '2026-07-23'),
(10, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-04-12'),
(10, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-04-18'),
(10, 'Comprado', 'Pedido paso a estado Comprado', '2026-04-18'),
(10, 'En bodega', 'Pedido paso a estado En bodega', '2026-04-27'),
(11, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-04-25'),
(11, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-01'),
(11, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-05'),
(11, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-10'),
(11, 'En transito', 'Pedido paso a estado En transito', '2026-05-07'),
(11, 'En aduana', 'Pedido paso a estado En aduana', '2026-05-25'),
(11, 'Entregado', 'Pedido paso a estado Entregado', '2026-05-13'),
(12, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-07-06'),
(12, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-07-12'),
(12, 'Comprado', 'Pedido paso a estado Comprado', '2026-07-16'),
(12, 'En bodega', 'Pedido paso a estado En bodega', '2026-07-18'),
(12, 'En transito', 'Pedido paso a estado En transito', '2026-07-22'),
(12, 'En aduana', 'Pedido paso a estado En aduana', '2026-07-31'),
(12, 'Entregado', 'Pedido paso a estado Entregado', '2026-07-30'),
(13, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-04-24'),
(13, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-04-26'),
(13, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-06'),
(13, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-09'),
(14, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-04-18'),
(14, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-04-23'),
(14, 'Comprado', 'Pedido paso a estado Comprado', '2026-04-22'),
(14, 'En bodega', 'Pedido paso a estado En bodega', '2026-04-27'),
(14, 'En transito', 'Pedido paso a estado En transito', '2026-05-12'),
(14, 'En aduana', 'Pedido paso a estado En aduana', '2026-05-03'),
(14, 'Entregado', 'Pedido paso a estado Entregado', '2026-05-24'),
(15, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-31'),
(15, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-06-04'),
(15, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-06'),
(15, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-12'),
(16, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-03'),
(16, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-05'),
(16, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-09'),
(16, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-12'),
(16, 'En transito', 'Pedido paso a estado En transito', '2026-05-11'),
(16, 'En aduana', 'Pedido paso a estado En aduana', '2026-05-13'),
(16, 'Entregado', 'Pedido paso a estado Entregado', '2026-06-02');

-- Fin del script.
