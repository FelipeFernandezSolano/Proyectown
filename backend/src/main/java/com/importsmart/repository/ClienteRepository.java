package com.importsmart.repository;

import com.importsmart.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    @Query("SELECT c FROM Cliente c WHERE " +
           "(:texto IS NULL OR LOWER(c.nombre) LIKE LOWER(CONCAT('%', :texto, '%')) " +
           " OR LOWER(c.contacto) LIKE LOWER(CONCAT('%', :texto, '%')) " +
           " OR c.numeroCliente LIKE CONCAT('%', :texto, '%')) " +
           "ORDER BY c.nombre ASC")
    List<Cliente> buscar(@Param("texto") String texto);
}
