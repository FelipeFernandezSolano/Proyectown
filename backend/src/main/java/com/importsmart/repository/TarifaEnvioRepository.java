package com.importsmart.repository;

import com.importsmart.model.TarifaEnvio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TarifaEnvioRepository extends JpaRepository<TarifaEnvio, Long> {
    Optional<TarifaEnvio> findByTipo(String tipo);
}
