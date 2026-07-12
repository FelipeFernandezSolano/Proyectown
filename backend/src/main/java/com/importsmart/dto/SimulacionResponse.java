package com.importsmart.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/** Resultado del simulador: comparacion de modalidades y de escenarios de empaque. */
@Data
public class SimulacionResponse {
    // RF-11: comparar envio aereo vs maritimo (costo, tiempo, utilidad).
    private List<CalculoResumenDTO> comparacionModalidad = new ArrayList<>();
    private String recomendadoModalidad;

    // RF-10: comparar empacar todo junto vs paquetes separados.
    private List<EscenarioDTO> escenariosEmpaque = new ArrayList<>();
    private String recomendadoEmpaque;
}
