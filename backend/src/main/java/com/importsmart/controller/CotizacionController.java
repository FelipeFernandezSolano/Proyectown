package com.importsmart.controller;

import com.importsmart.service.CotizacionService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cotizaciones")
public class CotizacionController {

    private final CotizacionService cotizacionService;

    public CotizacionController(CotizacionService cotizacionService) {
        this.cotizacionService = cotizacionService;
    }

    @GetMapping("/{pedidoId}/pdf")
    public ResponseEntity<byte[]> pdf(@PathVariable Long pedidoId) {
        byte[] pdf = cotizacionService.generarInterna(pedidoId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=cotizacion-interna-" + pedidoId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{pedidoId}/pdf-interno")
    public ResponseEntity<byte[]> pdfInterno(@PathVariable Long pedidoId) {
        byte[] pdf = cotizacionService.generarInterna(pedidoId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=cotizacion-interna-" + pedidoId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{pedidoId}/pdf-cliente")
    public ResponseEntity<byte[]> pdfCliente(@PathVariable Long pedidoId) {
        byte[] pdf = cotizacionService.generarCliente(pedidoId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=cotizacion-cliente-" + pedidoId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
