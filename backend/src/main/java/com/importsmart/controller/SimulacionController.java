package com.importsmart.controller;

import com.importsmart.dto.SimulacionRequest;
import com.importsmart.dto.SimulacionResponse;
import com.importsmart.service.SimulacionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/simulacion")
public class SimulacionController {

    private final SimulacionService simulacionService;

    public SimulacionController(SimulacionService simulacionService) {
        this.simulacionService = simulacionService;
    }

    @PostMapping
    public SimulacionResponse simular(@RequestBody SimulacionRequest req) {
        return simulacionService.simular(req);
    }
}
