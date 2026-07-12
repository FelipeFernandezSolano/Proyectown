package com.importsmart.controller;

import com.importsmart.dto.ClienteDTO;
import com.importsmart.dto.PedidoResumenDTO;
import com.importsmart.model.Cliente;
import com.importsmart.service.ClienteService;
import com.importsmart.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;
    private final PedidoService pedidoService;

    public ClienteController(ClienteService clienteService, PedidoService pedidoService) {
        this.clienteService = clienteService;
        this.pedidoService = pedidoService;
    }

    @GetMapping
    public List<Cliente> buscar(@RequestParam(required = false) String texto) {
        return clienteService.buscar(texto);
    }

    @GetMapping("/{id}")
    public Cliente obtener(@PathVariable Long id) {
        return clienteService.obtener(id);
    }

    @GetMapping("/{id}/pedidos")
    public List<PedidoResumenDTO> pedidosDelCliente(@PathVariable Long id) {
        return pedidoService.porCliente(id);
    }

    @PostMapping
    public Cliente crear(@Valid @RequestBody ClienteDTO dto) {
        return clienteService.crear(dto);
    }

    @PutMapping("/{id}")
    public Cliente actualizar(@PathVariable Long id, @Valid @RequestBody ClienteDTO dto) {
        return clienteService.actualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        clienteService.eliminar(id);
    }
}
