package com.importsmart.controller;

import com.importsmart.dto.DashboardKpisDTO;
import com.importsmart.dto.GananciaProductoDTO;
import com.importsmart.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/kpis")
    public DashboardKpisDTO kpis() {
        return dashboardService.kpis();
    }

    @GetMapping("/productos-mas-rentables")
    public List<GananciaProductoDTO> productosMasRentables(@RequestParam(defaultValue = "8") int limite) {
        return dashboardService.productosMasRentables(limite);
    }
}
