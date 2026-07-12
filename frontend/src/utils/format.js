export const formatoUSD = (valor) => {
  const numero = Number(valor) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(numero);
};

export const formatoColones = (valor) => {
  const numero = Number(valor) || 0;
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(numero);
};

export const formatoNumero = (valor, decimales = 2) => {
  const numero = Number(valor) || 0;
  return numero.toLocaleString("es-CR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
};

export const formatoKg = (valor) => `${formatoNumero(valor, 2)} kg`;

export const formatoFecha = (valor) => {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString("es-CR");
};

// Etiquetas y colores del semaforo de rentabilidad (RF-12).
export const RENTABILIDAD = {
  RENTABLE: { texto: "Rentable", clase: "badge-verde", punto: "#12a37a" },
  POCO_RENTABLE: { texto: "Poco rentable", clase: "badge-ambar", punto: "#f59e0b" },
  NO_RENTABLE: { texto: "No rentable", clase: "badge-rojo", punto: "#dc2626" },
};
