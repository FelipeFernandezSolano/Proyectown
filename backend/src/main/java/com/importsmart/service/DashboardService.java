package com.importsmart.service;

import com.importsmart.dto.DashboardKpisDTO;
import com.importsmart.dto.GananciaProductoDTO;
import com.importsmart.model.Pedido;
import com.importsmart.model.PedidoItem;
import com.importsmart.model.Rentabilidad;
import com.importsmart.repository.PedidoItemRepository;
import com.importsmart.repository.PedidoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Indicadores y graficos del panel de resultados (RF-15). */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final PedidoRepository pedidoRepository;
    private final PedidoItemRepository pedidoItemRepository;

    public DashboardService(PedidoRepository pedidoRepository, PedidoItemRepository pedidoItemRepository) {
        this.pedidoRepository = pedidoRepository;
        this.pedidoItemRepository = pedidoItemRepository;
    }

    public DashboardKpisDTO kpis() {
        DashboardKpisDTO d = new DashboardKpisDTO();
        List<Pedido> pedidos = pedidoRepository.findAll();
        BigDecimal utilidad = BigDecimal.ZERO;
        BigDecimal ventas = BigDecimal.ZERO;
        BigDecimal costos = BigDecimal.ZERO;
        long activos = 0, rent = 0, poco = 0, no = 0;
        for (Pedido p : pedidos) {
            utilidad = utilidad.add(nz(p.getUtilidad()));
            ventas = ventas.add(nz(p.getTotalVenta()));
            costos = costos.add(nz(p.getSubtotalProductos()))
                    .add(nz(p.getCostoEnvio())).add(nz(p.getGastosAdicionales()));
            if (p.getEstadoPedido() == null || !"Entregado".equalsIgnoreCase(p.getEstadoPedido().getNombre())) {
                activos++;
            }
            if (p.getRentabilidad() == Rentabilidad.RENTABLE) rent++;
            else if (p.getRentabilidad() == Rentabilidad.POCO_RENTABLE) poco++;
            else no++;
        }
        d.setTotalPedidos(pedidos.size());
        d.setPedidosActivos(activos);
        d.setUtilidadTotal(utilidad);
        d.setVentasTotales(ventas);
        d.setCostosAcumulados(costos);
        d.setRentables(rent);
        d.setPocoRentables(poco);
        d.setNoRentables(no);
        return d;
    }

    /** Productos mas rentables por utilidad bruta acumulada (RF-15). */
    public List<GananciaProductoDTO> productosMasRentables(int limite) {
        Map<String, long[]> cantidades = new LinkedHashMap<>();
        Map<String, BigDecimal> utilidades = new LinkedHashMap<>();
        for (PedidoItem it : pedidoItemRepository.findAll()) {
            if (it.getProducto() == null) continue;
            String nombre = it.getProducto().getNombre();
            int cant = it.getCantidad() == null ? 0 : it.getCantidad();
            BigDecimal margenUnit = nz(it.getPrecioVenta()).subtract(nz(it.getCostoUnitario()));
            BigDecimal aporta = margenUnit.multiply(BigDecimal.valueOf(cant));
            cantidades.computeIfAbsent(nombre, k -> new long[]{0})[0] += cant;
            utilidades.merge(nombre, aporta, BigDecimal::add);
        }
        return utilidades.entrySet().stream()
                .map(e -> new GananciaProductoDTO(e.getKey(),
                        cantidades.get(e.getKey())[0], e.getValue()))
                .sorted(Comparator.comparing(GananciaProductoDTO::getUtilidadGenerada).reversed())
                .limit(limite)
                .toList();
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }
}
