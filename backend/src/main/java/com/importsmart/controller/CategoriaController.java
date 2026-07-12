package com.importsmart.controller;

import com.importsmart.model.Categoria;
import com.importsmart.repository.CategoriaRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final CategoriaRepository categoriaRepository;

    public CategoriaController(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @GetMapping
    public List<Categoria> listar() {
        return categoriaRepository.findAll();
    }

    @PostMapping
    public Categoria crear(@RequestBody Map<String, String> body) {
        String nombre = body.getOrDefault("nombre", "").trim();
        if (nombre.isEmpty()) throw new IllegalArgumentException("El nombre de la categoria es obligatorio");
        return categoriaRepository.findByNombreIgnoreCase(nombre).orElseGet(() -> {
            Categoria c = new Categoria();
            c.setNombre(nombre);
            return categoriaRepository.save(c);
        });
    }
}
