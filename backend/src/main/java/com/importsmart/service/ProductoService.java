package com.importsmart.service;

import com.importsmart.dto.ProductoDTO;
import com.importsmart.model.Categoria;
import com.importsmart.model.Producto;
import com.importsmart.repository.CategoriaRepository;
import com.importsmart.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoService(ProductoRepository productoRepository, CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    public List<Producto> buscar(String texto) {
        return productoRepository.buscar(blankToNull(texto));
    }

    public List<Producto> listarActivos() {
        return productoRepository.findByActivoTrueOrderByNombreAsc();
    }

    public Producto obtener(Long id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + id));
    }

    public Producto crear(ProductoDTO dto) {
        Producto p = new Producto();
        aplicar(p, dto);
        return productoRepository.save(p);
    }

    public Producto actualizar(Long id, ProductoDTO dto) {
        Producto p = obtener(id);
        aplicar(p, dto);
        return productoRepository.save(p);
    }

    /** Baja logica: se desactiva para no romper pedidos historicos que lo referencian. */
    public void eliminar(Long id) {
        Producto p = obtener(id);
        p.setActivo(false);
        productoRepository.save(p);
    }

    private void aplicar(Producto p, ProductoDTO dto) {
        p.setNombre(dto.getNombre().trim());
        p.setDescripcion(blankToNull(dto.getDescripcion()));
        p.setCostoUnitario(nz(dto.getCostoUnitario()));
        p.setPrecioVenta(nz(dto.getPrecioVenta()));
        p.setPesoKg(nz(dto.getPesoKg()));
        p.setLargoCm(nz(dto.getLargoCm()));
        p.setAnchoCm(nz(dto.getAnchoCm()));
        p.setAltoCm(nz(dto.getAltoCm()));
        p.setLinkProveedor(blankToNull(dto.getLinkProveedor()));
        p.setActivo(dto.getActivo() == null ? Boolean.TRUE : dto.getActivo());
        if (dto.getCategoriaId() != null) {
            Categoria cat = categoriaRepository.findById(dto.getCategoriaId())
                    .orElseThrow(() -> new IllegalArgumentException("Categoria no encontrada: " + dto.getCategoriaId()));
            p.setCategoria(cat);
        } else {
            p.setCategoria(null);
        }
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private String blankToNull(String v) {
        return (v == null || v.isBlank()) ? null : v.trim();
    }
}
