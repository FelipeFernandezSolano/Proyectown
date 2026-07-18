export const MONEDAS = [
  { codigo: "USD", nombre: "Dolar estadounidense (USD)", simbolo: "$" },
  { codigo: "CRC", nombre: "Colon costarricense (CRC)", simbolo: "₡" },
  { codigo: "EUR", nombre: "Euro (EUR)", simbolo: "€" },
  { codigo: "CNY", nombre: "Yuan chino (CNY)", simbolo: "¥" },
  { codigo: "MXN", nombre: "Peso mexicano (MXN)", simbolo: "$" },
  { codigo: "COP", nombre: "Peso colombiano (COP)", simbolo: "$" },
  { codigo: "JPY", nombre: "Yen japones (JPY)", simbolo: "¥" },
  { codigo: "GBP", nombre: "Libra esterlina (GBP)", simbolo: "£" },
  { codigo: "CAD", nombre: "Dolar canadiense (CAD)", simbolo: "$" },
  { codigo: "BRL", nombre: "Real brasileno (BRL)", simbolo: "R$" },
];

export const nombreMoneda = (codigo) => MONEDAS.find((m) => m.codigo === codigo)?.nombre || codigo;

export const simboloMoneda = (codigo) => MONEDAS.find((m) => m.codigo === codigo)?.simbolo || codigo;
