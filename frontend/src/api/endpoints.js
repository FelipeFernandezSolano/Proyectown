import client from "./client";

// ---- Auth ----
export const login = (email, password) =>
  client.post("/auth/login", { email, password }).then((r) => r.data);

// ---- Dashboard (RF-15) ----
export const getKpis = () => client.get("/dashboard/kpis").then((r) => r.data);
export const getProductosMasRentables = (limite = 8) =>
  client.get(`/dashboard/productos-mas-rentables?limite=${limite}`).then((r) => r.data);

// ---- Clientes / empresas (RF-02) ----
export const buscarClientes = (texto = "") =>
  client.get("/clientes", { params: { texto } }).then((r) => r.data);
export const crearCliente = (dto) => client.post("/clientes", dto).then((r) => r.data);
export const actualizarCliente = (id, dto) =>
  client.put(`/clientes/${id}`, dto).then((r) => r.data);
export const eliminarCliente = (id) => client.delete(`/clientes/${id}`).then((r) => r.data);
export const pedidosDeCliente = (id) =>
  client.get(`/clientes/${id}/pedidos`).then((r) => r.data);

// ---- Productos (RF-03) ----
export const buscarProductos = (texto = "") =>
  client.get("/productos", { params: { texto } }).then((r) => r.data);
export const getProductosActivos = () => client.get("/productos/activos").then((r) => r.data);
export const crearProducto = (dto) => client.post("/productos", dto).then((r) => r.data);
export const actualizarProducto = (id, dto) =>
  client.put(`/productos/${id}`, dto).then((r) => r.data);
export const eliminarProducto = (id) => client.delete(`/productos/${id}`).then((r) => r.data);

// ---- Categorias ----
export const getCategorias = () => client.get("/categorias").then((r) => r.data);

// ---- Pedidos (RF-04, RF-13, RF-14) ----
export const getPedidos = () => client.get("/pedidos").then((r) => r.data);
export const getPedido = (id) => client.get(`/pedidos/${id}`).then((r) => r.data);
export const crearPedido = (dto) => client.post("/pedidos", dto).then((r) => r.data);
export const actualizarPedido = (id, dto) =>
  client.put(`/pedidos/${id}`, dto).then((r) => r.data);
export const cambiarEstadoPedido = (id, estadoNombre, nota) =>
  client.patch(`/pedidos/${id}/estado`, { estadoNombre, nota }).then((r) => r.data);
export const eliminarPedido = (id) => client.delete(`/pedidos/${id}`).then((r) => r.data);

// ---- Catalogos ----
export const getEstados = () => client.get("/estados").then((r) => r.data);
export const getTarifas = () => client.get("/tarifas").then((r) => r.data);

// ---- Simulador (RF-10, RF-11) ----
export const simular = (dto) => client.post("/simulacion", dto).then((r) => r.data);

// ---- Tipo de cambio - API externa (RF-09) ----
export const getTipoCambio = () => client.get("/tipo-cambio").then((r) => r.data);
export const convertirUsd = (usd) =>
  client.get("/tipo-cambio/convertir", { params: { usd } }).then((r) => r.data);

// ---- Cotizacion PDF (RF-16) ----
export const descargarCotizacion = (pedidoId) =>
  client.get(`/cotizaciones/${pedidoId}/pdf`, { responseType: "blob" });

export const descargarBlob = (blobResponse, nombreArchivo) => {
  const url = window.URL.createObjectURL(new Blob([blobResponse.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", nombreArchivo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
