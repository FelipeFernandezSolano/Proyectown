package com.importsmart.service;

import com.importsmart.dto.*;
import com.importsmart.model.*;
import com.importsmart.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Servicio central de pedidos de importacion. Al crear o editar un pedido recalcula
 * automaticamente pesos (RF-06/07), costo de envio (RF-07), utilidad (RF-08) y el
 * semaforo de rentabilidad (RF-12), y mantiene la linea de tiempo de estados (RF-14).
 */
@Service
@Transactional
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final EstadoPedidoRepository estadoRepository;
    private final TarifaEnvioRepository tarifaRepository;
    private final HistorialEstadoRepository historialRepository;
    private final CalculoService calculo;
    private final TipoCambioService tipoCambioService;

    public PedidoService(PedidoRepository pedidoRepository, ClienteRepository clienteRepository,
                         ProductoRepository productoRepository, EstadoPedidoRepository estadoRepository,
                         TarifaEnvioRepository tarifaRepository, HistorialEstadoRepository historialRepository,
                         CalculoService calculo, TipoCambioService tipoCambioService) {
        this.pedidoRepository = pedidoRepository;
        this.clienteRepository = clienteRepository;
        this.productoRepository = productoRepository;
        this.estadoRepository = estadoRepository;
        this.tarifaRepository = tarifaRepository;
        this.historialRepository = historialRepository;
        this.calculo = calculo;
        this.tipoCambioService = tipoCambioService;
    }

    // ---------------------------------------------------------------- lecturas

    public List<PedidoResumenDTO> listar() {
        Map<String, TarifaEnvio> tarifas = mapaTarifas();
        return pedidoRepository.findAllByOrderByFechaPedidoDesc().stream()
                .map(p -> toResumen(p, tarifas))
                .toList();
    }

    public List<PedidoResumenDTO> porCliente(Long clienteId) {
        Map<String, TarifaEnvio> tarifas = mapaTarifas();
        return pedidoRepository.findByClienteIdOrderByFechaPedidoDesc(clienteId).stream()
                .map(p -> toResumen(p, tarifas))
                .toList();
    }

    public PedidoDetalleDTO obtenerDetalle(Long id) {
        return toDetalle(buscar(id));
    }

    public PedidoDetalleDTO obtenerDetalleParaCliente(Long id, Long clienteId) {
        Pedido pedido = pedidoRepository.findByIdAndClienteId(id, clienteId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado para este cliente: " + id));
        return toDetalle(pedido);
    }

    private Pedido buscar(Long id) {
        return pedidoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pedido no encontrado: " + id));
    }

    // ---------------------------------------------------------------- escritura

    public PedidoDetalleDTO crear(PedidoRequest req) {
        Pedido p = new Pedido();
        p.setCodigo(generarCodigo());
        p.setFechaPedido(LocalDate.now());
        p.setTipoCambio(tipoCambioService.obtener().getColonesPorDolar());

        String estadoNombre = (req.getEstadoNombre() == null || req.getEstadoNombre().isBlank())
                ? "Cotizado" : req.getEstadoNombre();
        EstadoPedido estado = estadoPorNombre(estadoNombre);
        p.setEstadoPedido(estado);

        aplicarDatos(p, req);
        Pedido guardado = pedidoRepository.save(p);

        registrarHistorial(guardado, estado.getNombre(),
                req.getNota() != null ? req.getNota() : "Pedido registrado");
        return toDetalle(guardado);
    }

    public PedidoDetalleDTO actualizar(Long id, PedidoRequest req) {
        Pedido p = buscar(id);
        // El estado se cambia por su endpoint propio; aca solo se actualizan datos y calculos.
        aplicarDatos(p, req);
        return toDetalle(pedidoRepository.save(p));
    }

    public void eliminar(Long id) {
        pedidoRepository.deleteById(id);
    }

    public PedidoDetalleDTO cambiarEstado(Long id, CambioEstadoDTO dto) {
        Pedido p = buscar(id);
        EstadoPedido estado = estadoPorNombre(dto.getEstadoNombre());
        p.setEstadoPedido(estado);
        Pedido guardado = pedidoRepository.save(p);
        registrarHistorial(guardado, estado.getNombre(),
                dto.getNota() != null ? dto.getNota() : "Cambio de estado a " + estado.getNombre());
        return toDetalle(guardado);
    }

    // --------------------------------------------------- nucleo de recalculo

    private void aplicarDatos(Pedido p, PedidoRequest req) {
        if (req.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(req.getClienteId())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado: " + req.getClienteId()));
            p.setCliente(cliente);
        }
        p.setDescripcion(req.getDescripcion());
        String direccionEntrega = req.getDireccionEntrega();
        if ((direccionEntrega == null || direccionEntrega.isBlank()) && p.getCliente() != null) {
            direccionEntrega = p.getCliente().getDireccion();
        }
        p.setDireccionEntrega(direccionEntrega);
        p.setTipoEnvio(parseTipo(req.getTipoEnvio()));
        p.setGastosAdicionales(nz(req.getGastosAdicionales()));
        p.setMontoPagado(nz(req.getMontoPagado()));

        // ---- Items (productos del pedido) ----
        p.getItems().clear();
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalVenta = BigDecimal.ZERO;
        if (req.getItems() != null) {
            for (PedidoItemDTO it : req.getItems()) {
                if (it.getProductoId() == null) continue;
                Producto prod = productoRepository.findById(it.getProductoId())
                        .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + it.getProductoId()));
                int cant = it.getCantidad() == null ? 1 : Math.max(1, it.getCantidad());
                BigDecimal costo = it.getCostoUnitario() != null ? it.getCostoUnitario() : nz(prod.getCostoUnitario());
                BigDecimal venta = it.getPrecioVenta() != null ? it.getPrecioVenta() : nz(prod.getPrecioVenta());

                PedidoItem item = new PedidoItem();
                item.setPedido(p);
                item.setProducto(prod);
                item.setCantidad(cant);
                item.setCostoUnitario(costo);
                item.setPrecioVenta(venta);
                p.getItems().add(item);

                subtotal = subtotal.add(costo.multiply(BigDecimal.valueOf(cant)));
                totalVenta = totalVenta.add(venta.multiply(BigDecimal.valueOf(cant)));
            }
        }

        // ---- Paquetes (peso volumetrico y facturable, RF-06/07) ----
        p.getPaquetes().clear();
        BigDecimal pesoRealTotal = BigDecimal.ZERO;
        BigDecimal pesoVolTotal = BigDecimal.ZERO;
        BigDecimal facturableTotal = BigDecimal.ZERO;
        BigDecimal costoEnvio = BigDecimal.ZERO;
        if (req.getPaquetes() != null) {
            int n = 1;
            for (PaqueteDTO pk : req.getPaquetes()) {
                BigDecimal vol = calculo.pesoVolumetrico(pk.getLargoCm(), pk.getAnchoCm(), pk.getAltoCm());
                BigDecimal facturable = calculo.pesoFacturable(pk.getPesoRealKg(), vol);
                BigDecimal real = nz(pk.getPesoRealKg());

                Paquete paquete = new Paquete();
                paquete.setPedido(p);
                paquete.setDescripcion(pk.getDescripcion() != null && !pk.getDescripcion().isBlank()
                        ? pk.getDescripcion() : "Paquete " + n);
                paquete.setLargoCm(nz(pk.getLargoCm()));
                paquete.setAnchoCm(nz(pk.getAnchoCm()));
                paquete.setAltoCm(nz(pk.getAltoCm()));
                paquete.setPesoRealKg(nz(pk.getPesoRealKg()));
                paquete.setPesoVolumetricoKg(vol);
                paquete.setPesoFacturableKg(facturable);
                p.getPaquetes().add(paquete);

                pesoRealTotal = pesoRealTotal.add(real);
                pesoVolTotal = pesoVolTotal.add(vol);
                facturableTotal = facturableTotal.add(facturable);
                costoEnvio = costoEnvio.add(calculo.costoEnvio(
                        real, vol, p.getTipoEnvio(), pk.getLargoCm(), pk.getAnchoCm(), pk.getAltoCm()));
                n++;
            }
        }

        // ---- Costos, utilidad y semaforo ----
        BigDecimal utilidad = calculo.utilidad(totalVenta, subtotal, costoEnvio, p.getGastosAdicionales());
        BigDecimal margen = calculo.margenPct(utilidad, totalVenta);

        p.setSubtotalProductos(subtotal);
        p.setTotalVenta(totalVenta);
        p.setPesoRealTotal(pesoRealTotal);
        p.setPesoVolumetricoTotal(pesoVolTotal);
        p.setPesoFacturableTotal(facturableTotal);
        p.setCostoEnvio(costoEnvio);
        p.setUtilidad(utilidad);
        p.setMargenPct(margen);
        p.setRentabilidad(calculo.clasificar(margen));
        if (p.getTipoCambio() == null) {
            p.setTipoCambio(tipoCambioService.obtener().getColonesPorDolar());
        }
    }

    private void registrarHistorial(Pedido p, String estadoNombre, String nota) {
        HistorialEstado h = new HistorialEstado();
        h.setPedido(p);
        h.setEstadoNombre(estadoNombre);
        h.setNota(nota);
        h.setFecha(LocalDate.now());
        historialRepository.save(h);
    }

    // --------------------------------------------------------------- mapeos

    private PedidoResumenDTO toResumen(Pedido p, Map<String, TarifaEnvio> tarifas) {
        PedidoResumenDTO d = new PedidoResumenDTO();
        d.setId(p.getId());
        d.setCodigo(p.getCodigo());
        if (p.getCliente() != null) {
            d.setClienteId(p.getCliente().getId());
            d.setClienteNombre(p.getCliente().getNombre());
        }
        d.setDescripcion(p.getDescripcion());
        d.setDireccionEntrega(p.getDireccionEntrega());
        d.setTipoEnvio(p.getTipoEnvio() != null ? p.getTipoEnvio().name() : null);
        if (p.getEstadoPedido() != null) {
            d.setEstado(p.getEstadoPedido().getNombre());
            d.setEstadoColor(p.getEstadoPedido().getColor());
            d.setEstadoOrden(p.getEstadoPedido().getOrden());
        }
        d.setTotalVenta(p.getTotalVenta());
        d.setMontoPagado(nz(p.getMontoPagado()));
        d.setSaldoPendiente(saldoPendiente(p));
        d.setUtilidad(p.getUtilidad());
        d.setMargenPct(p.getMargenPct());
        d.setRentabilidad(p.getRentabilidad() != null ? p.getRentabilidad().name() : null);
        d.setPesoFacturableTotal(p.getPesoFacturableTotal());
        d.setFechaPedido(p.getFechaPedido());
        TarifaEnvio t = p.getTipoEnvio() != null ? tarifas.get(p.getTipoEnvio().name()) : null;
        d.setDiasEstimados(t != null ? t.getDiasEstimados() : null);
        return d;
    }

    private PedidoDetalleDTO toDetalle(Pedido p) {
        PedidoDetalleDTO d = new PedidoDetalleDTO();
        d.setId(p.getId());
        d.setCodigo(p.getCodigo());
        if (p.getCliente() != null) {
            d.setClienteId(p.getCliente().getId());
            d.setClienteNombre(p.getCliente().getNombre());
            d.setClienteContacto(p.getCliente().getContacto());
        }
        d.setDescripcion(p.getDescripcion());
        d.setDireccionEntrega(p.getDireccionEntrega());
        d.setTipoEnvio(p.getTipoEnvio() != null ? p.getTipoEnvio().name() : null);
        if (p.getEstadoPedido() != null) {
            d.setEstado(p.getEstadoPedido().getNombre());
            d.setEstadoColor(p.getEstadoPedido().getColor());
        }
        d.setTipoCambio(p.getTipoCambio());
        d.setSubtotalProductos(p.getSubtotalProductos());
        d.setCostoEnvio(p.getCostoEnvio());
        d.setGastosAdicionales(p.getGastosAdicionales());
        d.setTotalVenta(p.getTotalVenta());
        d.setMontoPagado(nz(p.getMontoPagado()));
        d.setSaldoPendiente(saldoPendiente(p));
        d.setUtilidad(p.getUtilidad());
        d.setMargenPct(p.getMargenPct());
        d.setRentabilidad(p.getRentabilidad() != null ? p.getRentabilidad().name() : null);
        d.setPesoRealTotal(p.getPesoRealTotal());
        d.setPesoVolumetricoTotal(p.getPesoVolumetricoTotal());
        d.setPesoFacturableTotal(p.getPesoFacturableTotal());
        d.setFechaPedido(p.getFechaPedido());

        TarifaEnvio t = p.getTipoEnvio() != null ? tarifaRepository.findByTipo(p.getTipoEnvio().name()).orElse(null) : null;
        d.setDiasEstimados(t != null ? t.getDiasEstimados() : null);

        for (PedidoItem it : p.getItems()) {
            PedidoItemDTO idto = new PedidoItemDTO();
            if (it.getProducto() != null) {
                idto.setProductoId(it.getProducto().getId());
                idto.setProductoNombre(it.getProducto().getNombre());
            }
            idto.setCantidad(it.getCantidad());
            idto.setCostoUnitario(it.getCostoUnitario());
            idto.setPrecioVenta(it.getPrecioVenta());
            BigDecimal cant = BigDecimal.valueOf(it.getCantidad() == null ? 0 : it.getCantidad());
            idto.setSubtotalCosto(nz(it.getCostoUnitario()).multiply(cant));
            idto.setSubtotalVenta(nz(it.getPrecioVenta()).multiply(cant));
            d.getItems().add(idto);
        }
        for (Paquete pk : p.getPaquetes()) {
            PaqueteDTO pdto = new PaqueteDTO();
            pdto.setId(pk.getId());
            pdto.setDescripcion(pk.getDescripcion());
            pdto.setLargoCm(pk.getLargoCm());
            pdto.setAnchoCm(pk.getAnchoCm());
            pdto.setAltoCm(pk.getAltoCm());
            pdto.setPesoRealKg(pk.getPesoRealKg());
            pdto.setPesoVolumetricoKg(pk.getPesoVolumetricoKg());
            pdto.setPesoFacturableKg(pk.getPesoFacturableKg());
            d.getPaquetes().add(pdto);
        }
        historialRepository.findByPedidoIdOrderByIdAsc(p.getId()).forEach(h ->
                d.getHistorial().add(new HistorialItemDTO(h.getEstadoNombre(), h.getNota(), h.getFecha())));
        return d;
    }

    // --------------------------------------------------------------- helpers

    private Map<String, TarifaEnvio> mapaTarifas() {
        Map<String, TarifaEnvio> m = new HashMap<>();
        tarifaRepository.findAll().forEach(t -> m.put(t.getTipo(), t));
        return m;
    }

    private BigDecimal tarifaPorKg(TipoEnvio tipo) {
        return tarifaRepository.findByTipo(tipo.name())
                .map(TarifaEnvio::getCostoPorKgUsd)
                .orElse(BigDecimal.ZERO);
    }

    private EstadoPedido estadoPorNombre(String nombre) {
        return estadoRepository.findByNombreIgnoreCase(nombre)
                .orElseThrow(() -> new IllegalArgumentException("Estado no valido: " + nombre));
    }

    private TipoEnvio parseTipo(String tipo) {
        if (tipo == null) return TipoEnvio.AEREO;
        try {
            return TipoEnvio.valueOf(tipo.trim().toUpperCase());
        } catch (Exception e) {
            return TipoEnvio.AEREO;
        }
    }

    private String generarCodigo() {
        long n = pedidoRepository.count() + 1;
        return String.format("IMP-%d%04d", LocalDate.now().getYear(), n);
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private BigDecimal saldoPendiente(Pedido p) {
        BigDecimal saldo = nz(p.getTotalVenta()).subtract(nz(p.getMontoPagado()));
        return saldo.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : saldo;
    }
}
