package com.importsmart.repository;

import com.importsmart.model.HistorialEstado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistorialEstadoRepository extends JpaRepository<HistorialEstado, Long> {
    // Se ordena por id (orden de insercion), que siempre refleja el avance real del pedido.
    // No se usa la fecha porque un cambio de estado hecho hoy debe ir al final aunque su
    // fecha sea posterior a la de registros anteriores.
    List<HistorialEstado> findByPedidoIdOrderByIdAsc(Long pedidoId);
}
