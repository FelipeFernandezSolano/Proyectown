package com.importsmart.service;

import com.importsmart.dto.*;
import com.importsmart.model.TarifaEnvio;
import com.importsmart.model.TipoEnvio;
import com.importsmart.repository.TarifaEnvioRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Simulador de escenarios de envio (RF-10 y RF-11): compara empacar todo junto vs.
 * en paquetes separados, y compara la modalidad aerea vs. maritima (costo, tiempo y utilidad).
 */
@Service
public class SimulacionService {

    private final CalculoService calculo;
    private final TarifaEnvioRepository tarifaRepository;

    public SimulacionService(CalculoService calculo, TarifaEnvioRepository tarifaRepository) {
        this.calculo = calculo;
        this.tarifaRepository = tarifaRepository;
    }

    public SimulacionResponse simular(SimulacionRequest req) {
        SimulacionResponse res = new SimulacionResponse();

        BigDecimal subtotal = nz(req.getSubtotalProductos());
        BigDecimal totalVenta = nz(req.getTotalVenta());
        BigDecimal gastos = nz(req.getGastosAdicionales());

        // ---- Pesos por paquete ----
        BigDecimal realTotal = BigDecimal.ZERO;
        BigDecimal volTotal = BigDecimal.ZERO;
        BigDecimal facturableSeparado = BigDecimal.ZERO;
        int cantidad = 0;
        if (req.getPaquetes() != null) {
            for (PaqueteDTO pk : req.getPaquetes()) {
                BigDecimal vol = calculo.pesoVolumetrico(pk.getLargoCm(), pk.getAnchoCm(), pk.getAltoCm());
                BigDecimal facturable = calculo.pesoFacturable(pk.getPesoRealKg(), vol);
                realTotal = realTotal.add(nz(pk.getPesoRealKg()));
                volTotal = volTotal.add(vol);
                facturableSeparado = facturableSeparado.add(facturable);
                cantidad++;
            }
        }
        // Consolidado: los volumenes se suman, el peso facturable es el mayor entre real y volumetrico total.
        BigDecimal facturableConsolidado = calculo.pesoFacturable(realTotal, volTotal);

        TarifaEnvio aereo = tarifa(TipoEnvio.AEREO);
        TarifaEnvio maritimo = tarifa(TipoEnvio.MARITIMO);

        // ---- RF-11: comparacion de modalidad (usando el empaque actual = separado) ----
        res.getComparacionModalidad().add(calcularModalidad(aereo, realTotal, volTotal, facturableSeparado, subtotal, totalVenta, gastos));
        res.getComparacionModalidad().add(calcularModalidad(maritimo, realTotal, volTotal, facturableSeparado, subtotal, totalVenta, gastos));
        res.setRecomendadoModalidad(recomendarModalidad(res));

        // ---- RF-10: escenarios de empaque ----
        res.getEscenariosEmpaque().add(escenario("Paquetes separados",
                cantidad + " paquete(s) enviados por separado; cada caja paga su propio peso facturable.",
                cantidad, realTotal, volTotal, facturableSeparado, aereo, maritimo));
        res.getEscenariosEmpaque().add(escenario("Consolidado en una caja",
                "Todo se empaca en una sola caja; el peso facturable es el mayor entre el peso real y el volumen total.",
                1, realTotal, volTotal, facturableConsolidado, aereo, maritimo));
        BigDecimal ahorro = facturableSeparado.subtract(facturableConsolidado);
        res.setRecomendadoEmpaque(ahorro.signum() > 0
                ? "Consolidar en una sola caja reduce el peso facturable en " + ahorro.stripTrailingZeros().toPlainString() + " kg."
                : "El empaque separado no genera sobrecosto: el peso real ya domina el volumetrico.");
        return res;
    }

    private CalculoResumenDTO calcularModalidad(TarifaEnvio tarifa, BigDecimal real, BigDecimal vol,
                                                BigDecimal facturable, BigDecimal subtotal,
                                                BigDecimal totalVenta, BigDecimal gastos) {
        CalculoResumenDTO d = new CalculoResumenDTO();
        BigDecimal costoPorKg = tarifa != null ? nz(tarifa.getCostoPorKgUsd()) : BigDecimal.ZERO;
        BigDecimal costoEnvio = calculo.costoEnvio(facturable, costoPorKg);
        BigDecimal utilidad = calculo.utilidad(totalVenta, subtotal, costoEnvio, gastos);
        BigDecimal margen = calculo.margenPct(utilidad, totalVenta);
        d.setTipoEnvio(tarifa != null ? tarifa.getTipo() : "N/D");
        d.setCostoPorKg(costoPorKg);
        d.setDiasEstimados(tarifa != null ? tarifa.getDiasEstimados() : null);
        d.setPesoRealTotal(real);
        d.setPesoVolumetricoTotal(vol);
        d.setPesoFacturableTotal(facturable);
        d.setSubtotalProductos(subtotal);
        d.setCostoEnvio(costoEnvio);
        d.setGastosAdicionales(gastos);
        d.setTotalVenta(totalVenta);
        d.setUtilidad(utilidad);
        d.setMargenPct(margen);
        d.setRentabilidad(calculo.clasificar(margen).name());
        return d;
    }

    private EscenarioDTO escenario(String nombre, String detalle, int cantidad, BigDecimal real,
                                   BigDecimal vol, BigDecimal facturable, TarifaEnvio aereo, TarifaEnvio maritimo) {
        EscenarioDTO e = new EscenarioDTO();
        e.setNombre(nombre);
        e.setDetalle(detalle);
        e.setCantidadPaquetes(cantidad);
        e.setPesoRealTotal(real);
        e.setPesoVolumetricoTotal(vol);
        e.setPesoFacturableTotal(facturable);
        e.setCostoEnvioAereo(calculo.costoEnvio(facturable, aereo != null ? aereo.getCostoPorKgUsd() : BigDecimal.ZERO));
        e.setCostoEnvioMaritimo(calculo.costoEnvio(facturable, maritimo != null ? maritimo.getCostoPorKgUsd() : BigDecimal.ZERO));
        return e;
    }

    private String recomendarModalidad(SimulacionResponse res) {
        CalculoResumenDTO aereo = res.getComparacionModalidad().get(0);
        CalculoResumenDTO maritimo = res.getComparacionModalidad().get(1);
        // Si hay venta cargada, se recomienda la de mayor utilidad; si no, la mas barata.
        int cmp;
        if (aereo.getTotalVenta() != null && aereo.getTotalVenta().signum() > 0) {
            cmp = aereo.getUtilidad().compareTo(maritimo.getUtilidad());
        } else {
            cmp = maritimo.getCostoEnvio().compareTo(aereo.getCostoEnvio()); // menor costo gana
        }
        if (cmp == 0) return "Ambas modalidades son equivalentes en costo.";
        return cmp > 0
                ? "Aereo: llega en ~" + aereo.getDiasEstimados() + " dias con mejor resultado neto."
                : "Maritimo: mas economico (~" + maritimo.getDiasEstimados() + " dias), conviene para esta carga.";
    }

    private TarifaEnvio tarifa(TipoEnvio tipo) {
        return tarifaRepository.findByTipo(tipo.name()).orElse(null);
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
