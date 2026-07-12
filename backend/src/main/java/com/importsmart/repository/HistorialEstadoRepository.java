package com.importsmart.repository;

import com.importsmart.model.HistorialEstado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HistorialEstadoRepository extends JpaRepository<HistorialEstado, Long> {
    List<HistorialEstado> findByPedidoIdOrderByFechaAscIdAsc(Long pedidoId);
}
