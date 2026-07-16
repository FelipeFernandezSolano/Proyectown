package com.importsmart.service;

import com.importsmart.model.Rentabilidad;
import com.importsmart.model.TipoEnvio;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Motor de calculos de ImportSmart. Centraliza las formulas de negocio para que sean
 * consistentes en todo el sistema (pedidos, simulador, cotizaciones).
 *
 *  - Peso volumetrico aereo (RF-06): (largo * ancho * alto / 1,000,000) * 168.
 *  - Peso facturable (RF-07): el mayor entre el peso real y el peso volumetrico.
 *  - Costo aereo: peso real a $20 + excedente volumetrico a $18.
 *  - Costo maritimo: (largo * ancho * alto / 1,000,000) * 850.
 *  - Utilidad (RF-08): venta - (costo de productos + envio + gastos adicionales).
 *  - Semaforo de rentabilidad (RF-12): segun el margen (%).
 */
@Service
public class CalculoService {

    private static final BigDecimal MILLON = BigDecimal.valueOf(1_000_000);

    @Value("${app.envio.costo-kg-real:20}")
    private BigDecimal costoKgReal;

    @Value("${app.envio.costo-kg-volumetrico-excedente:18}")
    private BigDecimal costoKgVolumetricoExcedente;

    @Value("${app.envio.factor-volumetrico-aereo:168}")
    private BigDecimal factorVolumetricoAereo;

    @Value("${app.envio.factor-maritimo-usd-m3:850}")
    private BigDecimal factorMaritimoUsdM3;

    @Value("${app.rentabilidad.umbral-rentable:25}")
    private BigDecimal umbralRentable;

    @Value("${app.rentabilidad.umbral-poco:12}")
    private BigDecimal umbralPoco;

    private static final int ESCALA = 2;

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    /** Volumen en metros cubicos a partir de dimensiones en centimetros. */
    public BigDecimal volumenM3(BigDecimal largo, BigDecimal ancho, BigDecimal alto) {
        return nz(largo).multiply(nz(ancho)).multiply(nz(alto))
                .divide(MILLON, 3, RoundingMode.HALF_UP);
    }

    /** Peso volumetrico aereo en kg: (largo * ancho * alto / 1,000,000) * 168. */
    public BigDecimal pesoVolumetrico(BigDecimal largo, BigDecimal ancho, BigDecimal alto) {
        return volumenM3(largo, ancho, alto)
                .multiply(nz(factorVolumetricoAereo))
                .setScale(3, RoundingMode.HALF_UP);
    }

    /** Peso facturable: el mayor entre real y volumetrico (RF-07). */
    public BigDecimal pesoFacturable(BigDecimal pesoReal, BigDecimal pesoVolumetrico) {
        return nz(pesoReal).max(nz(pesoVolumetrico)).setScale(ESCALA, RoundingMode.HALF_UP);
    }

    /** Costo aereo = peso real * 20 + excedente volumetrico * 18. */
    public BigDecimal costoEnvio(BigDecimal pesoReal, BigDecimal pesoVolumetrico) {
        BigDecimal real = nz(pesoReal);
        BigDecimal vol = nz(pesoVolumetrico);
        BigDecimal excedenteVolumetrico = vol.subtract(real).max(BigDecimal.ZERO);
        return real.multiply(nz(costoKgReal))
                .add(excedenteVolumetrico.multiply(nz(costoKgVolumetricoExcedente)))
                .setScale(ESCALA, RoundingMode.HALF_UP);
    }

    public BigDecimal costoEnvio(BigDecimal pesoReal, BigDecimal pesoVolumetrico,
                                 TipoEnvio tipoEnvio, BigDecimal largo, BigDecimal ancho, BigDecimal alto) {
        if (tipoEnvio == TipoEnvio.MARITIMO) {
            return costoEnvioMaritimo(largo, ancho, alto);
        }
        return costoEnvio(pesoReal, pesoVolumetrico);
    }

    /** Costo maritimo = volumen m3 * 850 USD. */
    public BigDecimal costoEnvioMaritimo(BigDecimal largo, BigDecimal ancho, BigDecimal alto) {
        return volumenM3(largo, ancho, alto)
                .multiply(nz(factorMaritimoUsdM3))
                .setScale(ESCALA, RoundingMode.HALF_UP);
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
