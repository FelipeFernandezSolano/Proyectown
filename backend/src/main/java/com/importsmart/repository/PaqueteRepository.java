package com.importsmart.repository;

import com.importsmart.model.Paquete;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaqueteRepository extends JpaRepository<Paquete, Long> {
    List<Paquete> findByPedidoId(Long pedidoId);
}
