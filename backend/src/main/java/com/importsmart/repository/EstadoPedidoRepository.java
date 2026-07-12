package com.importsmart.repository;

import com.importsmart.model.EstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EstadoPedidoRepository extends JpaRepository<EstadoPedido, Long> {
    List<EstadoPedido> findAllByOrderByOrdenAsc();
    Optional<EstadoPedido> findByNombreIgnoreCase(String nombre);
}
