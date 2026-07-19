import { createContext, useContext, useState } from "react";
import { login as loginApi, registrar as registrarApi, loginConGoogle as loginConGoogleApi } from "../api/endpoints";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const stored = localStorage.getItem("is_usuario");
    return stored ? JSON.parse(stored) : null;
  });

  const guardarSesion = (data) => {
    localStorage.setItem("is_token", data.token);
    const usuarioInfo = { nombre: data.nombre, rol: data.rol, clienteId: data.clienteId };
    localStorage.setItem("is_usuario", JSON.stringify(usuarioInfo));
    setUsuario(usuarioInfo);
    return usuarioInfo;
  };

  const login = async (email, password) => {
    const data = await loginApi(email, password);
    return guardarSesion(data);
  };

  const registrar = async (dto) => {
    const data = await registrarApi(dto);
    return guardarSesion(data);
  };

  const loginConGoogle = async (credential) => {
    const data = await loginConGoogleApi(credential);
    return guardarSesion(data);
  };

  const logout = () => {
    localStorage.removeItem("is_token");
    localStorage.removeItem("is_usuario");
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, registrar, loginConGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
