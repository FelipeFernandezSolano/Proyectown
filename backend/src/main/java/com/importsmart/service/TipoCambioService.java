package com.importsmart.service;

import com.importsmart.dto.ConversionMonedaDTO;
import com.importsmart.dto.TipoCambioDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Consume una API publica externa de tipo de cambio (RF-09) y guarda las tasas en cache
 * durante el dia. Fuente: https://open.er-api.com/v6/latest/{MONEDA}, que permite usar
 * codigos ISO 4217 como USD, EUR, CRC, MXN, COP, etc. Es gratuita, sin API key y se
 * actualiza cada 24 horas.
 *
 * Comportamiento:
 *  - Consulta una vez al dia por moneda base; el resto usa cache.
 *  - Una tarea programada invalida el cache cada dia a las 6:00 a.m.
 *  - Si la API falla y existe cache previo, conserva el ultimo valor bueno.
 *  - Para USD -> CRC mantiene respaldo configurable para que el sistema siga funcionando.
 */
@Service
public class TipoCambioService {

    @Value("${app.tipocambio.url:https://open.er-api.com/v6/latest/USD}")
    private String apiUrlUsd;

    @Value("${app.tipocambio.base-url:https://open.er-api.com/v6/latest}")
    private String apiBaseUrl;

    @Value("${app.tipocambio.fallback:512.35}")
    private BigDecimal fallbackUsdCrc;

    private final RestClient restClient = RestClient.create();
    private final Map<String, TasasCache> cachePorBase = new ConcurrentHashMap<>();

    /** Devuelve el tipo de cambio USD -> CRC del dia, conservando el contrato anterior. */
    public TipoCambioDTO obtener() {
        TasasCache tasas = obtenerTasas("USD");
        BigDecimal crc = tasas.rates().get("CRC");
        if (crc == null) {
            crc = fallbackUsdCrc;
        }
        return new TipoCambioDTO("USD", crc, tasas.fecha(), tasas.fuente(), tasas.enLinea(), tasas.rates());
    }

    /** Fuerza una nueva consulta USD -> CRC y actualiza el cache. */
    public synchronized TipoCambioDTO refrescar() {
        cachePorBase.remove("USD");
        return obtener();
    }

    /** Convierte entre cualquier moneda soportada por la API externa. */
    public ConversionMonedaDTO convertir(BigDecimal monto, String monedaOrigen, String monedaDestino) {
        BigDecimal montoSeguro = monto == null ? BigDecimal.ZERO : monto;
        String origen = normalizarMoneda(monedaOrigen, "monedaOrigen");
        String destino = normalizarMoneda(monedaDestino, "monedaDestino");

        BigDecimal tasa;
        TasasCache tasas;
        if (origen.equals(destino)) {
            tasa = BigDecimal.ONE;
            tasas = obtenerTasas(origen);
        } else {
            tasas = obtenerTasas(origen);
            tasa = tasas.rates().get(destino);
            if (tasa == null) {
                throw new IllegalArgumentException("Moneda destino no soportada por la API: " + destino);
            }
        }

        BigDecimal resultado = montoSeguro.multiply(tasa).setScale(2, RoundingMode.HALF_UP);
        return new ConversionMonedaDTO(
                montoSeguro.setScale(2, RoundingMode.HALF_UP),
                origen,
                destino,
                tasa,
                resultado,
                tasas.fecha(),
                tasas.fuente(),
                tasas.enLinea()
        );
    }

    /** Refresco automatico diario a las 6:00 a.m.; invalida cache para obligar tasas nuevas. */
    @Scheduled(cron = "0 0 6 * * *")
    public void refrescoProgramado() {
        cachePorBase.clear();
        obtener(); // precarga USD -> CRC, que se muestra en Dashboard/Navbar.
    }

    /** Convierte un monto en dolares a colones usando el tipo de cambio actual. */
    public BigDecimal usdAColones(BigDecimal montoUsd) {
        BigDecimal tc = obtener().getColonesPorDolar();
        return (montoUsd == null ? BigDecimal.ZERO : montoUsd).multiply(tc);
    }

    private TasasCache obtenerTasas(String base) {
        String monedaBase = normalizarMoneda(base, "monedaBase");
        TasasCache actual = cachePorBase.get(monedaBase);
        LocalDate hoy = LocalDate.now();
        if (actual != null && hoy.equals(actual.fechaCache())) {
            return actual;
        }
        return refrescarTasas(monedaBase);
    }

    private synchronized TasasCache refrescarTasas(String base) {
        TasasCache actual = cachePorBase.get(base);
        LocalDate hoy = LocalDate.now();
        if (actual != null && hoy.equals(actual.fechaCache())) {
            return actual;
        }

        TasasCache consultado = consultarApi(base);
        if (consultado.enLinea()) {
            cachePorBase.put(base, consultado);
            return consultado;
        }

        if (actual != null) {
            return actual;
        }

        if ("USD".equals(base)) {
            cachePorBase.put(base, consultado);
            return consultado;
        }

        throw new IllegalStateException("No se pudo consultar tasas para " + base + " y no hay cache disponible.");
    }

    @SuppressWarnings("unchecked")
    private TasasCache consultarApi(String base) {
        String url = "USD".equals(base) ? apiUrlUsd : apiBaseUrl + "/" + base;
        try {
            Map<String, Object> resp = restClient.get().uri(url).retrieve().body(Map.class);
            if (resp != null && "success".equals(resp.get("result"))) {
                Map<String, Object> rawRates = (Map<String, Object>) resp.get("rates");
                if (rawRates != null && !rawRates.isEmpty()) {
                    Map<String, BigDecimal> rates = new HashMap<>();
                    rawRates.forEach((moneda, valor) -> {
                        if (valor != null) {
                            rates.put(moneda.toUpperCase(), new BigDecimal(valor.toString()));
                        }
                    });
                    String fecha = String.valueOf(resp.getOrDefault("time_last_update_utc", ""));
                    return new TasasCache(base, rates, fecha, "open.er-api.com", true, LocalDate.now());
                }
            }
        } catch (Exception ignored) {
            // cae al respaldo/cache
        }

        Map<String, BigDecimal> respaldo = new HashMap<>();
        if ("USD".equals(base)) {
            respaldo.put("CRC", fallbackUsdCrc);
        }
        return new TasasCache(base, respaldo, "N/D (respaldo)", "fallback", false, LocalDate.now());
    }

    private String normalizarMoneda(String moneda, String campo) {
        if (moneda == null || moneda.isBlank()) {
            throw new IllegalArgumentException(campo + " es obligatoria");
        }
        String normalizada = moneda.trim().toUpperCase();
        if (!normalizada.matches("^[A-Z]{3}$")) {
            throw new IllegalArgumentException(campo + " debe ser un codigo ISO de 3 letras, por ejemplo USD, CRC o EUR");
        }
        return normalizada;
    }

    private record TasasCache(
            String base,
            Map<String, BigDecimal> rates,
            String fecha,
            String fuente,
            boolean enLinea,
            LocalDate fechaCache
    ) {}
}
