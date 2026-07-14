package com.importsmart.controller;

import com.importsmart.dto.TipoCambioDTO;
import com.importsmart.dto.ConversionMonedaDTO;
import com.importsmart.service.TipoCambioService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@RestController
@RequestMapping("/api/tipo-cambio")
public class TipoCambioController {

    private final TipoCambioService tipoCambioService;

    public TipoCambioController(TipoCambioService tipoCambioService) {
        this.tipoCambioService = tipoCambioService;
    }

    @GetMapping
    public TipoCambioDTO actual() {
        return tipoCambioService.obtener();
    }

    /** Convierte un monto USD -> CRC usando el tipo de cambio de la API externa (RF-09). */
    @GetMapping("/convertir")
    public Map<String, Object> convertir(@RequestParam BigDecimal usd) {
        TipoCambioDTO tc = tipoCambioService.obtener();
        BigDecimal crc = usd.multiply(tc.getColonesPorDolar()).setScale(2, RoundingMode.HALF_UP);
        return Map.of(
                "usd", usd,
                "crc", crc,
                "tipoCambio", tc.getColonesPorDolar(),
                "fuente", tc.getFuente(),
                "enLinea", tc.isEnLinea()
        );
    }

    /** Convierte cualquier moneda soportada por la API externa (ej. USD -> CRC, EUR -> USD). */
    @GetMapping("/convertir-moneda")
    public ConversionMonedaDTO convertirMoneda(@RequestParam BigDecimal monto,
                                               @RequestParam String origen,
                                               @RequestParam String destino) {
        return tipoCambioService.convertir(monto, origen, destino);
    }
}
