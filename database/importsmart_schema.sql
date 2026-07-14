
CREATE DATABASE importsmart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE importsmart;

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
--   admin@importsmart.com    / admin123      (rol ADMINISTRADOR)
--   operador@importsmart.com / operador123   (rol OPERADOR)
-- ---------------------------------------------------------------------------
INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES
('Administrador', 'admin@importsmart.com', '$2b$10$6vctLYktZ.aewJvhcbKb7OD4Bamg.rVzqfJznqbTxkzks2i76bZI6', 'ADMINISTRADOR', 1),
('Operador', 'operador@importsmart.com', '$2b$10$J20yDVjD7THutWbuddMdiOunNOw7KSUwYk3dbRYI1h0vnBwsh/OiC', 'OPERADOR', 1);

INSERT INTO categorias (nombre) VALUES
('Electronica'),
('Hogar y cocina'),
('Repuestos automotrices'),
('Herramientas'),
('Belleza y cuidado personal'),
('Deportes y fitness');

INSERT INTO tarifas_envio (tipo, costo_por_kg_usd, dias_estimados, descripcion) VALUES
('AEREO', 20.0, 6, 'Tarifa comercial: $20 por kg real y $18 por kg de excedente volumetrico.'),
('MARITIMO', 20.0, 35, 'Tarifa comercial: $20 por kg real y $18 por kg de excedente volumetrico.');

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
(2, 'IMP-20260002', 10, 'Freidora de aire 5.5L AirCook, Audifonos Bluetooth ANC X200', 'AEREO', 6, 512.35, 78.0, 183.0, 24.64, 422.75, 137.11, 32.43, 'RENTABLE', 5.6, 14.64, 14.64, '2026-05-08'),
(3, 'IMP-20260003', 11, 'Cafetera Espresso CremaPro, Set de herramientas 108 piezas', 'MARITIMO', 6, 512.35, 169.0, 99.46, 44.99, 420.02, 106.57, 25.37, 'RENTABLE', 19.4, 31.08, 31.08, '2026-06-30'),
(4, 'IMP-20260004', 12, 'Parlante portatil BoomMax, Mancuernas ajustables 24kg', 'MARITIMO', 3, 512.35, 222.0, 159.04, 34.05, 556.22, 141.13, 25.37, 'RENTABLE', 49.7, 14.86, 49.7, '2026-07-06'),
(5, 'IMP-20260005', 12, 'Taladro inalambrico 20V MaxDrill, Set de brochas de maquillaje 15pz', 'MARITIMO', 4, 512.35, 50.0, 19.62, 26.44, 103.75, 7.69, 7.41, 'NO_RENTABLE', 2.8, 6.13, 6.13, '2026-05-06'),
(6, 'IMP-20260006', 10, 'Set de herramientas 108 piezas, Plancha de cabello TitanX', 'MARITIMO', 5, 512.35, 108.5, 43.42, 27.17, 193.41, 14.32, 7.4, 'NO_RENTABLE', 12.45, 13.57, 13.57, '2026-06-11'),
(7, 'IMP-20260007', 3, 'Plancha de cabello TitanX', 'AEREO', 2, 512.35, 49.5, 21.0, 25.39, 122.73, 26.84, 21.87, 'POCO_RENTABLE', 1.65, 1.68, 1.68, '2026-06-24'),
(8, 'IMP-20260008', 11, 'Set de brochas de maquillaje 15pz, Secadora de cabello IonPro 2200W, Mancuernas ajustables 24kg', 'MARITIMO', 6, 512.35, 330.5, 239.52, 37.59, 814.19, 206.58, 25.37, 'RENTABLE', 74.85, 25.61, 74.85, '2026-05-09'),
(9, 'IMP-20260009', 7, 'Cafetera Espresso CremaPro, Bateria automotriz 12V 60Ah', 'MARITIMO', 7, 512.35, 123.0, 60.16, 40.64, 286.46, 62.66, 21.87, 'POCO_RENTABLE', 18.8, 14.24, 18.8, '2026-05-04'),
(10, 'IMP-20260010', 8, 'Cafetera Espresso CremaPro, Kit de frenos delanteros ProStop', 'MARITIMO', 5, 512.35, 227.0, 120.54, 26.39, 478.63, 104.7, 21.87, 'POCO_RENTABLE', 22.1, 37.67, 37.67, '2026-04-16'),
(11, 'IMP-20260011', 1, 'Juego de amortiguadores RoadX, Set de brochas de maquillaje 15pz', 'AEREO', 4, 512.35, 113.5, 183.12, 43.6, 408.25, 68.03, 16.66, 'POCO_RENTABLE', 14.65, 13.87, 14.65, '2026-06-16'),
(12, 'IMP-20260012', 7, 'Secadora de cabello IonPro 2200W, Parlante portatil BoomMax, Kit de frenos delanteros ProStop', 'MARITIMO', 1, 512.35, 99.0, 49.31, 23.22, 219.56, 48.03, 21.88, 'POCO_RENTABLE', 7.15, 15.41, 15.41, '2026-06-28'),
(13, 'IMP-20260013', 1, 'Bicicleta estatica SpinPro, Mancuernas ajustables 24kg', 'AEREO', 5, 512.35, 494.0, 4686.5, 30.98, 7712.99, 2501.51, 32.43, 'RENTABLE', 90.0, 374.92, 374.92, '2026-06-05'),
(14, 'IMP-20260014', 11, 'Taladro inalambrico 20V MaxDrill, Licuadora PowerBlend 1200W, Audifonos Bluetooth ANC X200', 'MARITIMO', 2, 512.35, 255.0, 182.46, 26.2, 658.41, 194.75, 29.58, 'RENTABLE', 16.8, 57.02, 57.02, '2026-05-01'),
(15, 'IMP-20260015', 4, 'Bicicleta estatica SpinPro, Licuadora PowerBlend 1200W', 'MARITIMO', 7, 512.35, 203.0, 653.31, 42.6, 1330.38, 431.47, 32.43, 'RENTABLE', 28.4, 204.16, 204.16, '2026-04-25'),
(16, 'IMP-20260016', 5, 'Esmeriladora angular 750W, Set de herramientas 108 piezas, Licuadora PowerBlend 1200W', 'AEREO', 6, 512.35, 111.5, 275.62, 9.9, 476.43, 79.41, 16.67, 'POCO_RENTABLE', 12.6, 22.05, 22.05, '2026-05-25');

INSERT INTO pedido_items (pedido_id, producto_id, cantidad, costo_unitario, precio_venta) VALUES
(1, 17, 1, 16.5, 141.76),
(1, 20, 3, 7.0, 60.14),
(2, 8, 1, 42.0, 227.63),
(2, 1, 2, 18.0, 97.56),
(3, 7, 2, 55.0, 136.69),
(3, 13, 2, 29.5, 73.32),
(4, 3, 2, 22.0, 55.12),
(4, 18, 2, 89.0, 222.99),
(5, 12, 1, 33.0, 68.47),
(5, 15, 2, 8.5, 17.64),
(6, 13, 2, 29.5, 52.59),
(6, 17, 3, 16.5, 29.41),
(7, 17, 3, 16.5, 40.91),
(8, 15, 3, 8.5, 20.94),
(8, 16, 2, 19.0, 46.81),
(8, 18, 3, 89.0, 219.25),
(9, 7, 1, 55.0, 128.09),
(9, 10, 1, 68.0, 158.37),
(10, 7, 2, 55.0, 115.97),
(10, 9, 3, 39.0, 82.23),
(11, 11, 2, 44.0, 158.27),
(11, 15, 3, 8.5, 30.57),
(12, 16, 2, 19.0, 42.14),
(12, 3, 1, 22.0, 48.79),
(12, 9, 1, 39.0, 86.49),
(13, 19, 3, 135.0, 2107.8),
(13, 18, 1, 89.0, 1389.59),
(14, 12, 3, 33.0, 85.2),
(14, 5, 3, 34.0, 87.79),
(14, 1, 3, 18.0, 46.48),
(15, 19, 1, 135.0, 884.74),
(15, 5, 2, 34.0, 222.82),
(16, 14, 2, 24.0, 102.55),
(16, 13, 1, 29.5, 126.05),
(16, 5, 1, 34.0, 145.28);

INSERT INTO paquetes (pedido_id, descripcion, largo_cm, ancho_cm, alto_cm, peso_real_kg, peso_volumetrico_kg, peso_facturable_kg) VALUES
(1, 'Caja consolidada 1', 67, 21, 51, 3.85, 14.35, 14.35),
(2, 'Caja consolidada 1', 41, 35, 51, 5.6, 14.64, 14.64),
(3, 'Caja consolidada 1', 50, 37, 84, 19.4, 31.08, 31.08),
(4, 'Caja consolidada 1', 43, 27, 64, 49.7, 14.86, 49.7),
(5, 'Caja consolidada 1', 41, 34, 22, 2.8, 6.13, 6.13),
(6, 'Caja consolidada 1', 47, 38, 38, 12.45, 13.57, 13.57),
(7, 'Caja consolidada 1', 36, 13, 18, 1.65, 1.68, 1.68),
(8, 'Caja consolidada 1', 44, 30, 97, 74.85, 25.61, 74.85),
(9, 'Caja consolidada 1', 37, 37, 52, 18.8, 14.24, 18.8),
(10, 'Caja consolidada 1', 42, 38, 118, 22.1, 37.67, 37.67),
(11, 'Caja consolidada 1', 67, 23, 45, 14.65, 13.87, 14.65),
(12, 'Caja consolidada 1', 39, 38, 52, 7.15, 15.41, 15.41),
(13, 'Caja consolidada 1', 103, 52, 350, 90.0, 374.92, 374.92),
(14, 'Caja consolidada 1', 48, 36, 165, 16.8, 57.02, 57.02),
(15, 'Caja consolidada 1', 107, 53, 180, 28.4, 204.16, 204.16),
(16, 'Caja consolidada 1', 47, 34, 69, 12.6, 22.05, 22.05);

INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha) VALUES
(1, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-08'),
(1, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-20'),
(1, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-01'),
(1, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-13'),
(1, 'En transito', 'Pedido paso a estado En transito', '2026-06-25'),
(2, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-08'),
(2, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-18'),
(2, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-28'),
(2, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-07'),
(2, 'En transito', 'Pedido paso a estado En transito', '2026-06-17'),
(2, 'En aduana', 'Pedido paso a estado En aduana', '2026-06-27'),
(3, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-06-30'),
(3, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-07-01'),
(3, 'Comprado', 'Pedido paso a estado Comprado', '2026-07-02'),
(3, 'En bodega', 'Pedido paso a estado En bodega', '2026-07-03'),
(3, 'En transito', 'Pedido paso a estado En transito', '2026-07-04'),
(3, 'En aduana', 'Pedido paso a estado En aduana', '2026-07-05'),
(4, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-07-06'),
(4, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-07-07'),
(4, 'Comprado', 'Pedido paso a estado Comprado', '2026-07-08'),
(5, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-06'),
(5, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-22'),
(5, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-07'),
(5, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-23'),
(6, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-06-11'),
(6, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-06-17'),
(6, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-23'),
(6, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-29'),
(6, 'En transito', 'Pedido paso a estado En transito', '2026-07-05'),
(7, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-06-24'),
(7, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-07-02'),
(8, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-09'),
(8, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-19'),
(8, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-29'),
(8, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-08'),
(8, 'En transito', 'Pedido paso a estado En transito', '2026-06-18'),
(8, 'En aduana', 'Pedido paso a estado En aduana', '2026-06-28'),
(9, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-04'),
(9, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-13'),
(9, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-22'),
(9, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-31'),
(9, 'En transito', 'Pedido paso a estado En transito', '2026-06-09'),
(9, 'En aduana', 'Pedido paso a estado En aduana', '2026-06-18'),
(9, 'Entregado', 'Pedido paso a estado Entregado', '2026-06-27'),
(10, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-04-16'),
(10, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-03'),
(10, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-20'),
(10, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-06'),
(10, 'En transito', 'Pedido paso a estado En transito', '2026-06-23'),
(11, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-06-16'),
(11, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-06-22'),
(11, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-28'),
(11, 'En bodega', 'Pedido paso a estado En bodega', '2026-07-04'),
(12, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-06-28'),
(13, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-06-05'),
(13, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-06-12'),
(13, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-19'),
(13, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-26'),
(13, 'En transito', 'Pedido paso a estado En transito', '2026-07-03'),
(14, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-01'),
(14, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-06-05'),
(15, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-04-25'),
(15, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-05-06'),
(15, 'Comprado', 'Pedido paso a estado Comprado', '2026-05-17'),
(15, 'En bodega', 'Pedido paso a estado En bodega', '2026-05-28'),
(15, 'En transito', 'Pedido paso a estado En transito', '2026-06-08'),
(15, 'En aduana', 'Pedido paso a estado En aduana', '2026-06-19'),
(15, 'Entregado', 'Pedido paso a estado Entregado', '2026-06-30'),
(16, 'Cotizado', 'Pedido paso a estado Cotizado', '2026-05-25'),
(16, 'Aprobado', 'Pedido paso a estado Aprobado', '2026-06-01'),
(16, 'Comprado', 'Pedido paso a estado Comprado', '2026-06-08'),
(16, 'En bodega', 'Pedido paso a estado En bodega', '2026-06-15'),
(16, 'En transito', 'Pedido paso a estado En transito', '2026-06-22'),
(16, 'En aduana', 'Pedido paso a estado En aduana', '2026-06-29');



DELIMITER //

CREATE PROCEDURE cargar_pedidos_masivos()
BEGIN
  DECLARE i INT DEFAULT 17;
  DECLARE cliente_id_v BIGINT;
  DECLARE producto_1 BIGINT;
  DECLARE producto_2 BIGINT;
  DECLARE cant_1 INT;
  DECLARE cant_2 INT;
  DECLARE tipo_envio_v VARCHAR(20);
  DECLARE estado_id_v BIGINT;
  DECLARE estado_nombre_v VARCHAR(50);
  DECLARE dias_estado INT;
  DECLARE fecha_v DATE;
  DECLARE costo_1 DECIMAL(12,2);
  DECLARE costo_2 DECIMAL(12,2);
  DECLARE venta_1 DECIMAL(12,2);
  DECLARE venta_2 DECIMAL(12,2);
  DECLARE subtotal_v DECIMAL(12,2);
  DECLARE gastos_v DECIMAL(12,2);
  DECLARE largo_v DECIMAL(10,2);
  DECLARE ancho_v DECIMAL(10,2);
  DECLARE alto_v DECIMAL(10,2);
  DECLARE peso_real_v DECIMAL(10,2);
  DECLARE peso_vol_v DECIMAL(10,2);
  DECLARE peso_fact_v DECIMAL(10,2);
  DECLARE costo_envio_v DECIMAL(12,2);
  DECLARE margen_objetivo DECIMAL(6,2);
  DECLARE total_venta_v DECIMAL(12,2);
  DECLARE utilidad_v DECIMAL(12,2);
  DECLARE margen_v DECIMAL(6,2);
  DECLARE rentabilidad_v VARCHAR(20);

  WHILE i <= 300 DO
    SET cliente_id_v = ((i - 1) MOD 12) + 1;
    SET producto_1 = ((i - 1) MOD 20) + 1;
    SET producto_2 = (i MOD 20) + 1;
    SET cant_1 = (i MOD 4) + 1;
    SET cant_2 = ((i + 1) MOD 3) + 1;
    SET tipo_envio_v = IF(i MOD 3 = 0, 'MARITIMO', 'AEREO');
    SET estado_id_v = ((i - 1) MOD 7) + 1;
    SET fecha_v = DATE_SUB('2026-07-13', INTERVAL (i MOD 120) DAY);

    SELECT nombre INTO estado_nombre_v FROM estados_pedido WHERE id = estado_id_v;
    SELECT costo_unitario, precio_venta INTO costo_1, venta_1 FROM productos WHERE id = producto_1;
    SELECT costo_unitario, precio_venta INTO costo_2, venta_2 FROM productos WHERE id = producto_2;

    SET subtotal_v = ROUND((costo_1 * cant_1) + (costo_2 * cant_2), 2);
    SET gastos_v = ROUND(8 + (i MOD 38), 2);
    SET largo_v = 24 + (i MOD 82);
    SET ancho_v = 18 + (i MOD 44);
    SET alto_v = 12 + (i MOD 68);
    SET peso_real_v = ROUND(2 + ((i MOD 42) * 0.75), 2);
    SET peso_vol_v = ROUND((largo_v * ancho_v * alto_v) / 5000, 2);
    SET peso_fact_v = GREATEST(peso_real_v, peso_vol_v);
    SET costo_envio_v = ROUND((peso_real_v * 20) + (GREATEST(peso_vol_v - peso_real_v, 0) * 18), 2);

    SET margen_objetivo = CASE
      WHEN i MOD 9 = 0 THEN 7
      WHEN i MOD 5 = 0 THEN 16
      ELSE 29
    END;
    SET total_venta_v = ROUND((subtotal_v + costo_envio_v + gastos_v) * (1 + (margen_objetivo / 100)), 2);
    SET utilidad_v = ROUND(total_venta_v - subtotal_v - costo_envio_v - gastos_v, 2);
    SET margen_v = ROUND((utilidad_v / total_venta_v) * 100, 2);
    SET rentabilidad_v = CASE
      WHEN margen_v >= 25 THEN 'RENTABLE'
      WHEN margen_v >= 12 THEN 'POCO_RENTABLE'
      ELSE 'NO_RENTABLE'
    END;

    INSERT INTO pedidos (
      id, codigo, cliente_id, descripcion, tipo_envio, estado_pedido_id, tipo_cambio,
      subtotal_productos, costo_envio, gastos_adicionales, total_venta, utilidad,
      margen_pct, rentabilidad, peso_real_total, peso_volumetrico_total,
      peso_facturable_total, fecha_pedido
    ) VALUES (
      i,
      CONCAT('IMP-2026', LPAD(i, 4, '0')),
      cliente_id_v,
      CONCAT('Pedido demo masivo ', i, ' - ImportSmart'),
      tipo_envio_v,
      estado_id_v,
      512.35,
      subtotal_v,
      costo_envio_v,
      gastos_v,
      total_venta_v,
      utilidad_v,
      margen_v,
      rentabilidad_v,
      peso_real_v,
      peso_vol_v,
      peso_fact_v,
      fecha_v
    );

    INSERT INTO pedido_items (pedido_id, producto_id, cantidad, costo_unitario, precio_venta) VALUES
    (i, producto_1, cant_1, costo_1, ROUND((total_venta_v * 0.52) / cant_1, 2)),
    (i, producto_2, cant_2, costo_2, ROUND((total_venta_v * 0.48) / cant_2, 2));

    INSERT INTO paquetes (
      pedido_id, descripcion, largo_cm, ancho_cm, alto_cm, peso_real_kg,
      peso_volumetrico_kg, peso_facturable_kg
    ) VALUES (
      i,
      CONCAT('Caja demo ', i),
      largo_v,
      ancho_v,
      alto_v,
      peso_real_v,
      peso_vol_v,
      peso_fact_v
    );

    INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha)
    VALUES (i, 'Cotizado', 'Pedido demo generado para avance del proyecto', fecha_v);

    IF estado_id_v >= 2 THEN
      INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha)
      VALUES (i, 'Aprobado', 'Pedido demo aprobado', DATE_ADD(fecha_v, INTERVAL 2 DAY));
    END IF;
    IF estado_id_v >= 3 THEN
      INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha)
      VALUES (i, 'Comprado', 'Pedido demo comprado', DATE_ADD(fecha_v, INTERVAL 4 DAY));
    END IF;
    IF estado_id_v >= 4 THEN
      INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha)
      VALUES (i, 'En bodega', 'Pedido demo recibido en bodega', DATE_ADD(fecha_v, INTERVAL 6 DAY));
    END IF;
    IF estado_id_v >= 5 THEN
      INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha)
      VALUES (i, 'En transito', 'Pedido demo en transito internacional', DATE_ADD(fecha_v, INTERVAL 8 DAY));
    END IF;
    IF estado_id_v >= 6 THEN
      INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha)
      VALUES (i, 'En aduana', 'Pedido demo en proceso aduanal', DATE_ADD(fecha_v, INTERVAL 10 DAY));
    END IF;
    IF estado_id_v >= 7 THEN
      INSERT INTO historial_estados (pedido_id, estado_nombre, nota, fecha)
      VALUES (i, 'Entregado', 'Pedido demo entregado al cliente', DATE_ADD(fecha_v, INTERVAL 12 DAY));
    END IF;

    SET i = i + 1;
  END WHILE;
END//

DELIMITER ;

CALL cargar_pedidos_masivos();
DROP PROCEDURE cargar_pedidos_masivos;

-- Recalculo final con regla comercial actual:
-- kg real a $20 y solo el excedente volumetrico a $18.
UPDATE pedidos p
JOIN (
  SELECT
    pedido_id,
    ROUND(SUM(peso_real_kg), 2) AS peso_real_total,
    ROUND(SUM(peso_volumetrico_kg), 2) AS peso_volumetrico_total,
    ROUND(SUM(GREATEST(peso_real_kg, peso_volumetrico_kg)), 2) AS peso_facturable_total,
    ROUND(SUM((peso_real_kg * 20) + (GREATEST(peso_volumetrico_kg - peso_real_kg, 0) * 18)), 2) AS costo_envio
  FROM paquetes
  GROUP BY pedido_id
) calc ON calc.pedido_id = p.id
SET
  p.peso_real_total = calc.peso_real_total,
  p.peso_volumetrico_total = calc.peso_volumetrico_total,
  p.peso_facturable_total = calc.peso_facturable_total,
  p.costo_envio = calc.costo_envio,
  p.utilidad = ROUND(p.total_venta - p.subtotal_productos - calc.costo_envio - p.gastos_adicionales, 2),
  p.margen_pct = CASE
    WHEN p.total_venta > 0 THEN ROUND(((p.total_venta - p.subtotal_productos - calc.costo_envio - p.gastos_adicionales) / p.total_venta) * 100, 2)
    ELSE 0
  END,
  p.rentabilidad = CASE
    WHEN p.total_venta > 0 AND ROUND(((p.total_venta - p.subtotal_productos - calc.costo_envio - p.gastos_adicionales) / p.total_venta) * 100, 2) >= 25 THEN 'RENTABLE'
    WHEN p.total_venta > 0 AND ROUND(((p.total_venta - p.subtotal_productos - calc.costo_envio - p.gastos_adicionales) / p.total_venta) * 100, 2) >= 12 THEN 'POCO_RENTABLE'
    ELSE 'NO_RENTABLE'
  END;

-- Total esperado despues de ejecutar el script completo desde cero: 300 pedidos.

-- Fin del script.
