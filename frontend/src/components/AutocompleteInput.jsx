import { useMemo, useState } from "react";

export default function AutocompleteInput({
  value,
  onChange,
  options = [],
  placeholder,
  className = "",
  showAllOnFocus = false,
}) {
  const [activo, setActivo] = useState(false);
  const texto = String(value || "");
  const coincidencias = useMemo(() => {
    const q = texto.trim().toLowerCase();
    const unicas = Array.from(new Set(options.filter(Boolean)));
    if (!q) return showAllOnFocus ? unicas.slice(0, 12) : [];
    return unicas
      .filter((op) => String(op).toLowerCase().includes(q))
      .slice(0, 8);
  }, [options, texto, showAllOnFocus]);

  const seleccionar = (opcion) => {
    onChange(opcion);
    setActivo(false);
  };

  return (
    <div className={`autocomplete ${className}`}>
      <input
        value={texto}
        onChange={(e) => {
          onChange(e.target.value);
          setActivo(true);
        }}
        onFocus={() => setActivo(true)}
        onBlur={() => window.setTimeout(() => setActivo(false), 120)}
        placeholder={placeholder}
      />
      {activo && coincidencias.length > 0 && (
        <div className="autocomplete-list">
          {coincidencias.map((opcion) => (
            <button type="button" key={opcion} onMouseDown={() => seleccionar(opcion)}>
              {opcion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
