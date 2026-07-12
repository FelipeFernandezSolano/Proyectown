import { createContext, useContext, useState } from "react";
import { login as loginApi } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem("is_usuario");
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    localStorage.setItem("is_token", data.token);
    const usuarioInfo = { nombre: data.nombre, rol: data.rol };
    localStorage.setItem("is_usuario", JSON.stringify(usuarioInfo));
    setUsuario(usuarioInfo);
    return usuarioInfo;
  };

  const logout = () => {
    localStorage.removeItem("is_token");
    localStorage.removeItem("is_usuario");
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
