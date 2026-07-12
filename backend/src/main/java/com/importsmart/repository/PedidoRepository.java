package com.importsmart.repository;

import com.importsmart.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findAllByOrderByFechaPedidoDesc();
    List<Pedido> findByClienteIdOrderByFechaPedidoDesc(Long clienteId);
    long countByEstadoPedidoNombreNot(String nombre);
}
