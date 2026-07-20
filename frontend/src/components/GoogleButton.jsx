import "./GoogleButton.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export default function GoogleButton({ texto = "Continuar con Google" }) {
  return (
    <a className="btn-google" href={`${API_BASE}/auth/google/login`}>
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92C16.66 14.2 17.64 11.9 17.64 9.2z" />
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.87-3.04.87-2.34 0-4.32-1.58-5.03-3.7H.94v2.33A9 9 0 0 0 9 18z" />
        <path fill="#FBBC05" d="M3.97 10.73A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.19.29-1.73V4.94H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.06l3.03-2.33z" />
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.94l3.03 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
      </svg>
      <span>{texto}</span>
    </a>
  );
}
