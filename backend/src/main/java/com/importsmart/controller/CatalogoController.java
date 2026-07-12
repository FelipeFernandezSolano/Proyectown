package com.importsmart.controller;

import com.importsmart.model.EstadoPedido;
import com.importsmart.model.TarifaEnvio;
import com.importsmart.repository.EstadoPedidoRepository;
import com.importsmart.repository.TarifaEnvioRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Catalogos de solo lectura usados por el frontend (estados y tarifas de envio). */
@RestController
@RequestMapping("/api")
public class CatalogoController {

    private final EstadoPedidoRepository estadoRepository;
    private final TarifaEnvioRepository tarifaRepository;

    public CatalogoController(EstadoPedidoRepository estadoRepository, TarifaEnvioRepository tarifaRepository) {
        this.estadoRepository = estadoRepository;
        this.tarifaRepository = tarifaRepository;
    }

    @GetMapping("/estados")
    public List<EstadoPedido> estados() {
        return estadoRepository.findAllByOrderByOrdenAsc();
    }

    @GetMapping("/tarifas")
    public List<TarifaEnvio> tarifas() {
        return tarifaRepository.findAll();
    }
}
