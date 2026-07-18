// Set minimo de iconos SVG en linea (sin dependencias externas).
const PATHS = {
  dashboard: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z",
  search: "M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 5L20.49 19l-5-5zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z",
  plus: "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75zm17.71-10.04a1 1 0 0 0 0-1.41l-2.51-2.51a1 1 0 0 0-1.41 0l-1.96 1.96 3.75 3.75z",
  users: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  tag: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3.4 13.4A2 2 0 0 1 2.8 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.4 7.4a2 2 0 0 1 0 2.8zM7.5 8A1.5 1.5 0 1 0 7.5 5 1.5 1.5 0 0 0 7.5 8z",
  box: "M12 2 3 7v10l9 5 9-5V7l-9-5zm0 2.2 6.5 3.6L12 11.4 5.5 7.8 12 4.2zM5 9.4l6 3.3v6.9l-6-3.3V9.4zm8 10.2v-6.9l6-3.3v6.9l-6 3.3z",
  trash: "M6 7h12l-1 13H7L6 7zm3-3h6l1 2H8l1-2zM9 9v9m3-9v9m3-9v9",
  check: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
  x: "M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.3 19.7 2.9 18.3 9.19 12 2.9 5.7 4.3 4.3l6.29 6.29L16.9 4.3z",
  user: "M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v2h16v-2c0-2.76-3.58-5-8-5z",
  arrowRight: "M4 11h13.17l-4.58-4.59L14 5l7 7-7 7-1.41-1.41L17.17 13H4z",
  chevronLeft: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  chevronRight: "M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z",
  clock: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm1-13h-1.5v6l5.2 3.1.75-1.23-4.45-2.64z",
  plane: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z",
  ship: "M4 10V5h5V3h6v2h5v5l-8 3zM3 13l9 3 9-3v2l-1 5H4l-1-5zm2 5h14l.4-2L12 18l-7.4-2z",
  calculator: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zm0 4v3h10V6zm1 6h2v2H8zm4 0h2v2h-2zm4 0h2v6h-2zM8 16h2v2H8zm4 0h2v2h-2z",
  quote: "M6 2h9l5 5v15H6V2zm8 1.5V8h4.5L14 3.5zM8 12h8v1.5H8V12zm0 3h8v1.5H8V15zm0-6h4v1.5H8V9z",
  exchange: "M7 7h11l-3-3 1.4-1.4L21.8 8 16.4 13.4 15 12l3-3H7zM17 17H6l3 3-1.4 1.4L2.2 16 7.6 10.6 9 12l-3 3h11z",
  chart: "M4 20V4h2v14h14v2H4zm4-3V9h2v8H8zm4 0V5h2v12h-2zm4 0v-6h2v6h-2z",
  timeline: "M4 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm0 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0zm0 6a2 2 0 1 1 4 0 2 2 0 0 1-4 0zM10 5h10v2H10zm0 6h10v2H10zm0 6h10v2H10z",
  logout: "M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z",
};

export default function Icon({ name, size = 16, style, className }) {
  const d = PATHS[name];
  if (!d) return null;
  const esTrash = name === "trash";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={esTrash ? "none" : "currentColor"}
      stroke={esTrash ? "currentColor" : "none"}
      strokeWidth={esTrash ? 1.6 : 0}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
