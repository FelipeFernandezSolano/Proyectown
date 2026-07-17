package com.importsmart.controller;

import com.importsmart.dto.CambioEstadoDTO;
import com.importsmart.dto.PedidoDetalleDTO;
import com.importsmart.dto.PedidoRequest;
import com.importsmart.dto.PedidoResumenDTO;
import com.importsmart.model.Usuario;
import com.importsmart.security.UserPrincipal;
import com.importsmart.service.PedidoService;
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
        if (esCliente(principal)) {
            return pedidoService.porCliente(clienteId(principal));
        }
        return pedidoService.listar();
    }

    @GetMapping("/{id}")
    public PedidoDetalleDTO obtener(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        if (esCliente(principal)) {
            return pedidoService.obtenerDetalleParaCliente(id, clienteId(principal));
        }
        return pedidoService.obtenerDetalle(id);
    }

    @PostMapping
    public PedidoDetalleDTO crear(@RequestBody PedidoRequest req, @AuthenticationPrincipal UserPrincipal principal) {
        if (esCliente(principal)) {
            req.setClienteId(clienteId(principal));
        }
        return pedidoService.crear(req);
    }

    @PutMapping("/{id}")
    public PedidoDetalleDTO actualizar(@PathVariable Long id, @RequestBody PedidoRequest req) {
        return pedidoService.actualizar(id, req);
    }

    @PatchMapping("/{id}/estado")
    public PedidoDetalleDTO cambiarEstado(@PathVariable Long id, @RequestBody CambioEstadoDTO dto) {
        return pedidoService.cambiarEstado(id, dto);
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

    private Long clienteId(UserPrincipal principal) {
        if (principal == null || principal.getUsuario() == null || principal.getUsuario().getCliente() == null) {
            throw new IllegalStateException("El usuario cliente no tiene clienteId asociado.");
        }
        return principal.getUsuario().getCliente().getId();
    }
}
