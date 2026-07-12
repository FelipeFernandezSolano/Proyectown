package com.importsmart.service;

import com.importsmart.dto.ClienteDTO;
import com.importsmart.model.Cliente;
import com.importsmart.repository.ClienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    public List<Cliente> buscar(String texto) {
        return clienteRepository.buscar(blankToNull(texto));
    }

    public Cliente obtener(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Empresa cliente no encontrada: " + id));
    }

    public Cliente crear(ClienteDTO dto) {
        Cliente c = new Cliente();
        aplicar(c, dto);
        c.setNumeroCliente(dto.getNumeroCliente() != null && !dto.getNumeroCliente().isBlank()
                ? dto.getNumeroCliente().trim() : generarNumero());
        return clienteRepository.save(c);
    }

    public Cliente actualizar(Long id, ClienteDTO dto) {
        Cliente c = obtener(id);
        aplicar(c, dto);
        return clienteRepository.save(c);
    }

    public void eliminar(Long id) {
        clienteRepository.deleteById(id);
    }

    private void aplicar(Cliente c, ClienteDTO dto) {
        c.setNombre(dto.getNombre().trim());
        c.setContacto(blankToNull(dto.getContacto()));
        c.setEmail(blankToNull(dto.getEmail()));
        c.setTelefono(blankToNull(dto.getTelefono()));
        c.setPais(blankToNull(dto.getPais()));
        c.setDireccion(blankToNull(dto.getDireccion()));
    }

    private String generarNumero() {
        long total = clienteRepository.count();
        return String.format("CL%04d", total + 1);
    }

    private String blankToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }
}
