package com.importsmart.service;

import com.importsmart.dto.TipoCambioDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

/**
 * Consume una API publica externa de tipo de cambio (RF-09) y guarda el valor en cache
 * durante todo el dia. Fuente: https://open.er-api.com/v6/latest/USD, que se alimenta de
 * datos de bancos centrales y se actualiza una vez cada 24 horas (fuente confiable y gratuita,
 * sin API key). Devuelve cuantos colones (CRC) equivale un dolar (USD).
 *
 * Comportamiento:
 *  - Solo consulta la API una vez al dia; el resto de las peticiones usan el valor cacheado.
 *  - Un tarea programada refresca el valor automaticamente cada dia a las 6:00 a.m.
 *  - Si la API no responde, conserva el ultimo valor bueno o usa un respaldo configurable.
 */
@Service
public class TipoCambioService {

    @Value("${app.tipocambio.url:https://open.er-api.com/v6/latest/USD}")
    private String apiUrl;

    @Value("${app.tipocambio.fallback:512.35}")
    private BigDecimal fallback;

    private final RestClient restClient = RestClient.create();

    // Cache diario
    private volatile TipoCambioDTO cache;
    private volatile LocalDate fechaCache;

    /** Devuelve el tipo de cambio del dia (usa cache si ya se consulto hoy). */
    public TipoCambioDTO obtener() {
        LocalDate hoy = LocalDate.now();
        TipoCambioDTO actual = cache;
        if (actual != null && hoy.equals(fechaCache)) {
            return actual;
        }
        return refrescar();
    }

    /** Fuerza una nueva consulta a la API y actualiza el cache. */
    public synchronized TipoCambioDTO refrescar() {
        LocalDate hoy = LocalDate.now();
        if (cache != null && hoy.equals(fechaCache)) {
            return cache; // otro hilo ya lo actualizo
        }
        TipoCambioDTO dto = consultarApi();
        if (dto.isEnLinea()) {
            cache = dto;
            fechaCache = hoy;
        } else if (cache != null) {
            // La API fallo: conservamos el ultimo valor bueno conocido.
            return cache;
        } else {
            cache = dto;      // primer arranque sin internet: usamos respaldo por hoy
            fechaCache = hoy;
        }
        return cache;
    }

    /** Refresco automatico diario a las 6:00 a.m. */
    @Scheduled(cron = "0 0 6 * * *")
    public void refrescoProgramado() {
        fechaCache = null; // invalida el cache para forzar nueva consulta
        refrescar();
    }

    @SuppressWarnings("unchecked")
    private TipoCambioDTO consultarApi() {
        try {
            Map<String, Object> resp = restClient.get().uri(apiUrl).retrieve().body(Map.class);
            if (resp != null && "success".equals(resp.get("result"))) {
                Map<String, Object> rates = (Map<String, Object>) resp.get("rates");
                Object crc = rates != null ? rates.get("CRC") : null;
                if (crc != null) {
                    BigDecimal valor = new BigDecimal(crc.toString());
                    String fecha = String.valueOf(resp.getOrDefault("time_last_update_utc", ""));
                    return new TipoCambioDTO("USD", valor, fecha, "open.er-api.com", true);
                }
            }
        } catch (Exception ignored) {
            // cae al respaldo
        }
        return new TipoCambioDTO("USD", fallback, "N/D (respaldo)", "fallback", false);
    }

    /** Convierte un monto en dolares a colones usando el tipo de cambio actual. */
    public BigDecimal usdAColones(BigDecimal montoUsd) {
        BigDecimal tc = obtener().getColonesPorDolar();
        return (montoUsd == null ? BigDecimal.ZERO : montoUsd).multiply(tc);
    }
}
