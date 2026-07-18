USE importsmart;

ALTER TABLE usuarios MODIFY COLUMN rol VARCHAR(20) NOT NULL;

UPDATE tarifas_envio
SET dias_estimados = 22,
    descripcion = 'Envio aereo: referencia operativa de 15 a 22 dias calendario.'
WHERE tipo = 'AEREO';

UPDATE tarifas_envio
SET dias_estimados = 55,
    descripcion = 'Envio maritimo consolidado: referencia operativa de 40 a 55 dias calendario.'
WHERE tipo = 'MARITIMO';

INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
SELECT 'Administrador', 'admin@importsmart.com', '$2b$10$6vctLYktZ.aewJvhcbKb7OD4Bamg.rVzqfJznqbTxkzks2i76bZI6', 'ADMINISTRADOR', 1
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'admin@importsmart.com'
);

INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
SELECT 'Operador', 'operador@importsmart.com', '$2b$10$J20yDVjD7THutWbuddMdiOunNOw7KSUwYk3dbRYI1h0vnBwsh/OiC', 'OPERADOR', 1
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'operador@importsmart.com'
);

UPDATE usuarios
SET nombre = 'Administrador',
    password_hash = '$2b$10$6vctLYktZ.aewJvhcbKb7OD4Bamg.rVzqfJznqbTxkzks2i76bZI6',
    rol = 'ADMINISTRADOR',
    activo = 1
WHERE email = 'admin@importsmart.com';

UPDATE usuarios
SET nombre = 'Operador',
    password_hash = '$2b$10$J20yDVjD7THutWbuddMdiOunNOw7KSUwYk3dbRYI1h0vnBwsh/OiC',
    rol = 'OPERADOR',
    activo = 1
WHERE email = 'operador@importsmart.com';

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE usuarios ADD COLUMN cliente_id BIGINT NULL',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'cliente_id'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE pedidos ADD COLUMN direccion_entrega VARCHAR(500) NULL',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'direccion_entrega'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE pedidos ADD COLUMN monto_pagado DECIMAL(12,2) NOT NULL DEFAULT 0',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'monto_pagado'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (
  SELECT IF(COUNT(*) = 0,
    'ALTER TABLE usuarios ADD CONSTRAINT fk_usuario_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND CONSTRAINT_NAME = 'fk_usuario_cliente'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO usuarios (nombre, email, password_hash, cliente_id, rol, activo)
SELECT 'TecnoAndes S.A.', 'cliente@importsmart.com', '$2b$12$J93crfjHCmM89F6wlbczKeJMQDrp3fwXyOiiNHabyjo754aBg94fC', 1, 'CLIENTE', 1
WHERE NOT EXISTS (
  SELECT 1 FROM usuarios WHERE email = 'cliente@importsmart.com'
);

UPDATE usuarios
SET nombre = COALESCE((SELECT nombre FROM clientes WHERE id = 1), 'TecnoAndes S.A.'),
    password_hash = '$2b$12$J93crfjHCmM89F6wlbczKeJMQDrp3fwXyOiiNHabyjo754aBg94fC',
    cliente_id = 1,
    rol = 'CLIENTE',
    activo = 1
WHERE email = 'cliente@importsmart.com';

UPDATE pedidos p
JOIN clientes c ON c.id = p.cliente_id
SET
  p.direccion_entrega = COALESCE(p.direccion_entrega, c.direccion),
  p.monto_pagado = CASE
    WHEN p.estado_pedido_id >= 7 THEN p.total_venta
    WHEN p.estado_pedido_id >= 5 THEN ROUND(p.total_venta * 0.65, 2)
    WHEN p.estado_pedido_id >= 2 THEN ROUND(p.total_venta * 0.35, 2)
    ELSE 0
  END
WHERE p.direccion_entrega IS NULL OR p.monto_pagado = 0;
