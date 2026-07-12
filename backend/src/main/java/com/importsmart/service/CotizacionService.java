package com.importsmart.service;

import com.importsmart.dto.PedidoDetalleDTO;
import com.importsmart.dto.PedidoItemDTO;
import com.importsmart.dto.TipoCambioDTO;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

/**
 * Genera la cotizacion de un pedido en PDF (RF-16): precio final estimado, costo de envio,
 * utilidad y tiempo aproximado de entrega. Los montos se muestran en USD y su equivalente en CRC.
 */
@Service
public class CotizacionService {

    private static final Color AZUL = new Color(12, 98, 145);
    private static final Color AZUL_OSCURO = new Color(10, 76, 113);
    private static final Color TEAL = new Color(20, 184, 196);
    private static final Color GRIS = new Color(91, 107, 122);
    private static final Color GRIS_CLARO = new Color(242, 246, 249);

    private final PedidoService pedidoService;
    private final TipoCambioService tipoCambioService;

    public CotizacionService(PedidoService pedidoService, TipoCambioService tipoCambioService) {
        this.pedidoService = pedidoService;
        this.tipoCambioService = tipoCambioService;
    }

    public byte[] generar(Long pedidoId) {
        PedidoDetalleDTO p = pedidoService.obtenerDetalle(pedidoId);
        TipoCambioDTO tc = tipoCambioService.obtener();
        BigDecimal tipoCambio = tc.getColonesPorDolar();

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ---- Encabezado con logo ----
            PdfPTable header = new PdfPTable(new float[]{1.2f, 3f});
            header.setWidthPercentage(100);
            header.getDefaultCell().setBorder(Rectangle.NO_BORDER);
            try {
                Image logo = Image.getInstance(new ClassPathResource("logo-importsmart.png").getInputStream().readAllBytes());
                logo.scaleToFit(70, 70);
                PdfPCell logoCell = new PdfPCell(logo, false);
                logoCell.setBorder(Rectangle.NO_BORDER);
                logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                header.addCell(logoCell);
            } catch (Exception e) {
                header.addCell(sinBorde(new Phrase("")));
            }
            Paragraph marca = new Paragraph();
            marca.add(new Chunk("ImportSmart\n", font(20, Font.BOLD, AZUL_OSCURO)));
            marca.add(new Chunk("Cotizacion de importacion", font(11, Font.NORMAL, GRIS)));
            PdfPCell marcaCell = new PdfPCell(marca);
            marcaCell.setBorder(Rectangle.NO_BORDER);
            marcaCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            header.addCell(marcaCell);
            doc.add(header);

            doc.add(barra());

            // ---- Datos generales ----
            PdfPTable info = new PdfPTable(2);
            info.setWidthPercentage(100);
            info.setSpacingBefore(12);
            info.addCell(sinBorde(par("Codigo: ", p.getCodigo())));
            info.addCell(sinBordeDer(par("Fecha: ", String.valueOf(p.getFechaPedido() != null ? p.getFechaPedido() : LocalDate.now()))));
            info.addCell(sinBorde(par("Cliente: ", p.getClienteNombre() != null ? p.getClienteNombre() : "-")));
            info.addCell(sinBordeDer(par("Contacto: ", p.getClienteContacto() != null ? p.getClienteContacto() : "-")));
            info.addCell(sinBorde(par("Modalidad: ", p.getTipoEnvio() + "  (~" + p.getDiasEstimados() + " dias)")));
            info.addCell(sinBordeDer(par("Estado: ", p.getEstado() != null ? p.getEstado() : "-")));
            doc.add(info);

            // ---- Tabla de productos ----
            PdfPTable tabla = new PdfPTable(new float[]{4f, 1.2f, 1.6f, 1.6f});
            tabla.setWidthPercentage(100);
            tabla.setSpacingBefore(16);
            th(tabla, "Producto");
            th(tabla, "Cant.");
            th(tabla, "Precio (USD)");
            th(tabla, "Subtotal (USD)");
            boolean alt = false;
            for (PedidoItemDTO it : p.getItems()) {
                Color bg = alt ? GRIS_CLARO : Color.WHITE;
                td(tabla, it.getProductoNombre(), bg, Element.ALIGN_LEFT);
                td(tabla, String.valueOf(it.getCantidad()), bg, Element.ALIGN_CENTER);
                td(tabla, money(it.getPrecioVenta()), bg, Element.ALIGN_RIGHT);
                td(tabla, money(it.getSubtotalVenta()), bg, Element.ALIGN_RIGHT);
                alt = !alt;
            }
            doc.add(tabla);

            // ---- Resumen de costos ----
            PdfPTable resumen = new PdfPTable(new float[]{3f, 2f});
            resumen.setWidthPercentage(55);
            resumen.setHorizontalAlignment(Element.ALIGN_RIGHT);
            resumen.setSpacingBefore(16);
            fila(resumen, "Subtotal productos", money(p.getSubtotalProductos()), false);
            fila(resumen, "Costo de envio (" + p.getTipoEnvio() + ")", money(p.getCostoEnvio()), false);
            fila(resumen, "Gastos adicionales", money(p.getGastosAdicionales()), false);
            fila(resumen, "Peso facturable", nn(p.getPesoFacturableTotal()) + " kg", false);
            fila(resumen, "TOTAL VENTA (USD)", money(p.getTotalVenta()), true);
            fila(resumen, "TOTAL VENTA (CRC)", colones(p.getTotalVenta(), tipoCambio), true);
            fila(resumen, "Utilidad estimada", money(p.getUtilidad()) + "  (" + nn(p.getMargenPct()) + "%)", false);
            doc.add(resumen);

            Paragraph rent = new Paragraph("Clasificacion de rentabilidad: " + etiqueta(p.getRentabilidad()),
                    font(11, Font.BOLD, colorRent(p.getRentabilidad())));
            rent.setSpacingBefore(14);
            doc.add(rent);

            Paragraph nota = new Paragraph(
                    "Tipo de cambio de referencia: 1 USD = " + nn(tipoCambio) + " CRC (" + tc.getFuente() + "). "
                    + "Cotizacion valida por 8 dias naturales. Los tiempos de transito son estimados.",
                    font(8.5f, Font.ITALIC, GRIS));
            nota.setSpacingBefore(20);
            doc.add(nota);

            doc.close();
            return out.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("No se pudo generar el PDF de la cotizacion", e);
        }
    }

    // ---------------------------------------------------------------- helpers

    private Font font(float size, int style, Color color) {
        return FontFactory.getFont(FontFactory.HELVETICA, size, style, color);
    }

    private PdfPCell barraCell() {
        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(TEAL);
        c.setFixedHeight(4);
        c.setBorder(Rectangle.NO_BORDER);
        return c;
    }

    private PdfPTable barra() {
        PdfPTable t = new PdfPTable(1);
        t.setWidthPercentage(100);
        t.setSpacingBefore(6);
        t.addCell(barraCell());
        return t;
    }

    private Paragraph par(String etiqueta, String valor) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(etiqueta, font(10, Font.BOLD, GRIS)));
        p.add(new Chunk(valor, font(10, Font.NORMAL, Color.DARK_GRAY)));
        return p;
    }

    private PdfPCell sinBorde(Phrase ph) {
        PdfPCell c = new PdfPCell(ph);
        c.setBorder(Rectangle.NO_BORDER);
        return c;
    }

    private PdfPCell sinBorde(Paragraph ph) {
        PdfPCell c = new PdfPCell();
        c.addElement(ph);
        c.setBorder(Rectangle.NO_BORDER);
        return c;
    }

    private PdfPCell sinBordeDer(Paragraph ph) {
        PdfPCell c = sinBorde(ph);
        c.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return c;
    }

    private void th(PdfPTable t, String texto) {
        PdfPCell c = new PdfPCell(new Phrase(texto, font(9.5f, Font.BOLD, Color.WHITE)));
        c.setBackgroundColor(AZUL);
        c.setPadding(7);
        c.setBorderColor(AZUL);
        t.addCell(c);
    }

    private void td(PdfPTable t, String texto, Color bg, int align) {
        PdfPCell c = new PdfPCell(new Phrase(texto != null ? texto : "-", font(9.5f, Font.NORMAL, Color.DARK_GRAY)));
        c.setBackgroundColor(bg);
        c.setPadding(6);
        c.setHorizontalAlignment(align);
        c.setBorderColor(new Color(226, 232, 238));
        t.addCell(c);
    }

    private void fila(PdfPTable t, String etiqueta, String valor, boolean fuerte) {
        int style = fuerte ? Font.BOLD : Font.NORMAL;
        Color color = fuerte ? AZUL_OSCURO : Color.DARK_GRAY;
        PdfPCell a = new PdfPCell(new Phrase(etiqueta, font(10, style, color)));
        a.setPadding(6);
        a.setBorder(Rectangle.BOTTOM);
        a.setBorderColor(new Color(226, 232, 238));
        PdfPCell b = new PdfPCell(new Phrase(valor, font(10, style, color)));
        b.setPadding(6);
        b.setHorizontalAlignment(Element.ALIGN_RIGHT);
        b.setBorder(Rectangle.BOTTOM);
        b.setBorderColor(new Color(226, 232, 238));
        if (fuerte) {
            a.setBackgroundColor(GRIS_CLARO);
            b.setBackgroundColor(GRIS_CLARO);
        }
        t.addCell(a);
        t.addCell(b);
    }

    private String money(BigDecimal v) {
        return "$ " + nn(v);
    }

    private String colones(BigDecimal usd, BigDecimal tc) {
        BigDecimal crc = (usd == null ? BigDecimal.ZERO : usd).multiply(tc == null ? BigDecimal.ZERO : tc);
        return "CRC " + crc.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String nn(BigDecimal v) {
        return (v == null ? BigDecimal.ZERO : v).setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String etiqueta(String r) {
        if (r == null) return "-";
        return switch (r) {
            case "RENTABLE" -> "RENTABLE";
            case "POCO_RENTABLE" -> "POCO RENTABLE";
            default -> "NO RENTABLE";
        };
    }

    private Color colorRent(String r) {
        if ("RENTABLE".equals(r)) return new Color(18, 163, 122);
        if ("POCO_RENTABLE".equals(r)) return new Color(217, 119, 6);
        return new Color(220, 38, 38);
    }
}
