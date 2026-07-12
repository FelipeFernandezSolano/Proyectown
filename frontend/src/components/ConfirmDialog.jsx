// Modal de confirmacion generico, para reemplazar los feos confirm() del navegador
// en acciones destructivas (ej. eliminar un pedido).
export default function ConfirmDialog({ abierto, titulo, mensaje, textoConfirmar = "Eliminar", onConfirmar, onCancelar }) {
  if (!abierto) return null;
  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p>{mensaje}</p>
        <div className="modal-acciones">
          <button className="btn btn-secundario" onClick={onCancelar}>Cancelar</button>
          <button className="btn btn-peligro" onClick={onConfirmar}>{textoConfirmar}</button>
        </div>
      </div>
    </div>
  );
}
