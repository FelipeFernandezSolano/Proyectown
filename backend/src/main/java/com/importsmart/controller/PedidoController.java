package com.importsmart.controller;

import com.importsmart.dto.CambioEstadoDTO;
import com.importsmart.dto.PedidoDetalleDTO;
import com.importsmart.dto.PedidoRequest;
import com.importsmart.dto.PedidoResumenDTO;
import com.importsmart.model.Usuario;
import com.importsmart.security.UserPrincipal;
import com.importsmart.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @GetMapping
    public List<PedidoResumenDTO> listar(@AuthenticationPrincipal UserPrincipal principal) {
        List<PedidoResumenDTO> pedidos = esCliente(principal)
                ? pedidoService.porCliente(clienteId(principal))
                : pedidoService.listar();
        if (esOperador(principal)) {
            pedidos.forEach(this::ocultarFinanzas);
        }
        if (esCliente(principal)) {
            pedidos.forEach(this::ocultarRentabilidadCliente);
        }
        return pedidos;
    }

    @GetMapping("/{id}")
    public PedidoDetalleDTO obtener(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        PedidoDetalleDTO detalle = esCliente(principal)
                ? pedidoService.obtenerDetalleParaCliente(id, clienteId(principal))
                : pedidoService.obtenerDetalle(id);
        if (esOperador(principal)) {
            ocultarFinanzas(detalle);
        }
        if (esCliente(principal)) {
            ocultarRentabilidadCliente(detalle);
        }
        return detalle;
    }

    @PostMapping
    public PedidoDetalleDTO crear(@Valid @RequestBody PedidoRequest req, @AuthenticationPrincipal UserPrincipal principal) {
        if (esCliente(principal)) {
            req.setClienteId(clienteId(principal));
            // El estado inicial de un pedido autogestionado por el cliente siempre es "En revisión":
            // no se confia en lo que mande el cliente en el payload (evita que se autoapruebe un pedido).
            req.setEstadoNombre("En revisión");
        }
        return pedidoService.crear(req);
    }

    @PutMapping("/{id}")
    public PedidoDetalleDTO actualizar(@PathVariable Long id, @RequestBody PedidoRequest req) {
        return pedidoService.actualizar(id, req);
    }

    @PatchMapping("/{id}/estado")
    public PedidoDetalleDTO cambiarEstado(@PathVariable Long id, @RequestBody CambioEstadoDTO dto,
                                           @AuthenticationPrincipal UserPrincipal principal) {
        PedidoDetalleDTO detalle = pedidoService.cambiarEstado(id, dto);
        if (esOperador(principal)) {
            ocultarFinanzas(detalle);
        }
        return detalle;
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        pedidoService.eliminar(id);
    }

    private boolean esCliente(UserPrincipal principal) {
        return principal != null
                && principal.getUsuario() != null
                && principal.getUsuario().getRol() == Usuario.RolUsuario.CLIENTE;
    }

    private boolean esOperador(UserPrincipal principal) {
        return principal != null
                && principal.getUsuario() != null
                && principal.getUsuario().getRol() == Usuario.RolUsuario.OPERADOR;
    }

    private Long clienteId(UserPrincipal principal) {
        if (principal == null || principal.getUsuario() == null || principal.getUsuario().getCliente() == null) {
            throw new IllegalStateException("El usuario cliente no tiene clienteId asociado.");
        }
        return principal.getUsuario().getCliente().getId();
    }

    /** El Operador solo gestiona logistica: sin utilidad, margen, rentabilidad ni montos de venta/pago. */
    private void ocultarFinanzas(PedidoResumenDTO dto) {
        dto.setUtilidad(null);
        dto.setMargenPct(null);
        dto.setRentabilidad(null);
        dto.setTotalVenta(null);
        dto.setMontoPagado(null);
        dto.setSaldoPendiente(null);
    }

    private void ocultarFinanzas(PedidoDetalleDTO dto) {
        dto.setUtilidad(null);
        dto.setMargenPct(null);
        dto.setRentabilidad(null);
        dto.setTotalVenta(null);
        dto.setMontoPagado(null);
        dto.setSaldoPendiente(null);
        dto.getItems().forEach(item -> {
            item.setPrecioVenta(null);
            item.setSubtotalVenta(null);
        });
    }

    /**
     * Bloqueo absoluto de rentabilidad para el rol Cliente: nunca recibe utilidad, margen ni
     * rentabilidad, ni el costo interno de la empresa (subtotal de costos / costo unitario),
     * para que no pueda derivar el margen del negocio. Sí conserva su precio y total estimado.
     */
    private void ocultarRentabilidadCliente(PedidoResumenDTO dto) {
        dto.setUtilidad(null);
        dto.setMargenPct(null);
        dto.setRentabilidad(null);
    }

    private void ocultarRentabilidadCliente(PedidoDetalleDTO dto) {
        dto.setUtilidad(null);
        dto.setMargenPct(null);
        dto.setRentabilidad(null);
        dto.setSubtotalProductos(null);
        dto.getItems().forEach(item -> {
            item.setCostoUnitario(null);
            item.setSubtotalCosto(null);
        });
    }
}
