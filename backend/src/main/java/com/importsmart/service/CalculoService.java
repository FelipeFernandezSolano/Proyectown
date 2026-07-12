package com.importsmart.service;

import com.importsmart.model.Rentabilidad;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Motor de calculos de ImportSmart. Centraliza las formulas de negocio para que sean
 * consistentes en todo el sistema (pedidos, simulador, cotizaciones).
 *
 *  - Peso volumetrico (RF-06): (largo * ancho * alto en cm) / divisor.
 *  - Peso facturable (RF-07): el mayor entre el peso real y el peso volumetrico.
 *  - Costo de envio (RF-07): peso facturable total * tarifa por kg de la modalidad.
 *  - Utilidad (RF-08): venta - (costo de productos + envio + gastos adicionales).
 *  - Semaforo de rentabilidad (RF-12): segun el margen (%).
 */
@Service
public class CalculoService {

    @Value("${app.envio.divisor-volumetrico:5000}")
    private BigDecimal divisorVolumetrico;

    @Value("${app.rentabilidad.umbral-rentable:25}")
    private BigDecimal umbralRentable;

    @Value("${app.rentabilidad.umbral-poco:12}")
    private BigDecimal umbralPoco;

    private static final int ESCALA = 2;

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    /** Peso volumetrico en kg a partir de las dimensiones en cm (RF-06). */
    public BigDecimal pesoVolumetrico(BigDecimal largo, BigDecimal ancho, BigDecimal alto) {
        BigDecimal vol = nz(largo).multiply(nz(ancho)).multiply(nz(alto));
        if (divisorVolumetrico == null || divisorVolumetrico.signum() == 0) return BigDecimal.ZERO;
        return vol.divide(divisorVolumetrico, ESCALA, RoundingMode.HALF_UP);
    }

    /** Peso facturable: el mayor entre real y volumetrico (RF-07). */
    public BigDecimal pesoFacturable(BigDecimal pesoReal, BigDecimal pesoVolumetrico) {
        return nz(pesoReal).max(nz(pesoVolumetrico)).setScale(ESCALA, RoundingMode.HALF_UP);
    }

    /** Costo de envio = peso facturable total * tarifa por kg (RF-07). */
    public BigDecimal costoEnvio(BigDecimal pesoFacturableTotal, BigDecimal costoPorKg) {
        return nz(pesoFacturableTotal).multiply(nz(costoPorKg)).setScale(ESCALA, RoundingMode.HALF_UP);
    }

    /** Utilidad = venta - (costo productos + envio + gastos) (RF-08). */
    public BigDecimal utilidad(BigDecimal totalVenta, BigDecimal subtotalProductos,
                               BigDecimal costoEnvio, BigDecimal gastosAdicionales) {
        return nz(totalVenta)
                .subtract(nz(subtotalProductos))
                .subtract(nz(costoEnvio))
                .subtract(nz(gastosAdicionales))
                .setScale(ESCALA, RoundingMode.HALF_UP);
    }

    /** Margen porcentual = utilidad / venta * 100. */
    public BigDecimal margenPct(BigDecimal utilidad, BigDecimal totalVenta) {
        if (totalVenta == null || totalVenta.signum() == 0) return BigDecimal.ZERO;
        return nz(utilidad).multiply(BigDecimal.valueOf(100))
                .divide(totalVenta, ESCALA, RoundingMode.HALF_UP);
    }

    /** Clasifica la rentabilidad de un pedido segun su margen (RF-12). */
    public Rentabilidad clasificar(BigDecimal margenPct) {
        BigDecimal m = nz(margenPct);
        if (m.compareTo(umbralRentable) >= 0) return Rentabilidad.RENTABLE;
        if (m.compareTo(umbralPoco) >= 0) return Rentabilidad.POCO_RENTABLE;
        return Rentabilidad.NO_RENTABLE;
    }
}
