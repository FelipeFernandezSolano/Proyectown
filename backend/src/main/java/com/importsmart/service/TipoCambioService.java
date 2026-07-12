package com.importsmart.service;

import com.importsmart.dto.TipoCambioDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Consume una API publica externa de tipo de cambio (RF-09).
 * Fuente: https://open.er-api.com/v6/latest/USD  (gratuita, sin API key).
 * Devuelve cuantos colones (CRC) equivale un dolar (USD). Si la API no responde,
 * usa un valor de respaldo configurable para que el sistema siga funcionando.
 */
@Service
public class TipoCambioService {

    @Value("${app.tipocambio.url:https://open.er-api.com/v6/latest/USD}")
    private String apiUrl;

    @Value("${app.tipocambio.fallback:512.35}")
    private BigDecimal fallback;

    private final RestClient restClient = RestClient.create();

    /** Consulta el tipo de cambio USD -> CRC en la API externa. */
    @SuppressWarnings("unchecked")
    public TipoCambioDTO obtener() {
        try {
            Map<String, Object> resp = restClient.get()
                    .uri(apiUrl)
                    .retrieve()
                    .body(Map.class);

            if (resp != null && "success".equals(resp.get("result"))) {
                Map<String, Object> rates = (Map<String, Object>) resp.get("rates");
                Object crc = rates != null ? rates.get("CRC") : null;
                if (crc != null) {
                    BigDecimal valor = new BigDecimal(crc.toString());
                    String fecha = String.valueOf(resp.getOrDefault("time_last_update_utc", ""));
                    return new TipoCambioDTO("USD", valor, fecha, apiUrl, true);
                }
            }
        } catch (Exception ignored) {
            // Cae al valor de respaldo mas abajo.
        }
        return new TipoCambioDTO("USD", fallback, "N/D (respaldo)", "fallback", false);
    }

    /** Convierte un monto en dolares a colones usando el tipo de cambio actual. */
    public BigDecimal usdAColones(BigDecimal montoUsd) {
        BigDecimal tc = obtener().getColonesPorDolar();
        return (montoUsd == null ? BigDecimal.ZERO : montoUsd).multiply(tc);
    }
}
