package com.importsmart.repository;

import com.importsmart.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrueOrderByNombreAsc();

    @Query("SELECT p FROM Producto p WHERE " +
           "(:texto IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :texto, '%'))) " +
           "ORDER BY p.nombre ASC")
    List<Producto> buscar(@Param("texto") String texto);
}
