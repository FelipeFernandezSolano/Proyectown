// Validaciones reutilizables para los formularios (Clientes y Productos).

export const requerido = (v) => v != null && String(v).trim().length > 0;

// Email valido: debe tener texto + @ + dominio + punto.
export const validarEmail = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

// Telefono: solo numeros (se permiten espacios, guiones y parentesis como formato),
// minimo 8 digitos. Rechaza letras.
export const validarTelefono = (v) => {
  const limpio = String(v || "").replace(/[\s()\-]/g, "");
  return /^\+?\d{8,}$/.test(limpio);
};

export const mayorQueCero = (v) => Number(v) > 0;

// Contraseña segura: minimo 8 caracteres, al menos una mayuscula y un caracter especial.
export const validarPasswordSegura = (v) =>
  /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(String(v || ""));
