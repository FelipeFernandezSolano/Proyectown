package com.importsmart.controller;

import com.importsmart.dto.CambioEstadoDTO;
import com.importsmart.dto.PedidoDetalleDTO;
import com.importsmart.dto.PedidoRequest;
import com.importsmart.dto.PedidoResumenDTO;
import com.importsmart.service.PedidoService;
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
    public List<PedidoResumenDTO> listar() {
        return pedidoService.listar();
    }

    @GetMapping("/{id}")
    public PedidoDetalleDTO obtener(@PathVariable Long id) {
        return pedidoService.obtenerDetalle(id);
    }

    @PostMapping
    public PedidoDetalleDTO crear(@RequestBody PedidoRequest req) {
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
}
