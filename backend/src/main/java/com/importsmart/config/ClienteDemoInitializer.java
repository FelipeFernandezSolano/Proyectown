package com.importsmart.config;

import com.importsmart.model.Cliente;
import com.importsmart.model.EstadoPedido;
import com.importsmart.model.HistorialEstado;
import com.importsmart.model.Pedido;
import com.importsmart.model.Producto;
import com.importsmart.model.Usuario;
import com.importsmart.dto.PaqueteDTO;
import com.importsmart.dto.PedidoItemDTO;
import com.importsmart.dto.PedidoRequest;
import com.importsmart.repository.ClienteRepository;
import com.importsmart.repository.EstadoPedidoRepository;
import com.importsmart.repository.HistorialEstadoRepository;
import com.importsmart.repository.PedidoRepository;
import com.importsmart.repository.ProductoRepository;
import com.importsmart.repository.UsuarioRepository;
import com.importsmart.service.PedidoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class ClienteDemoInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ClienteDemoInitializer.class);

    private final JdbcTemplate jdbcTemplate;
    private final UsuarioRepository usuarioRepository;
    private final ClienteRepository clienteRepository;
    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final EstadoPedidoRepository estadoPedidoRepository;
    private final HistorialEstadoRepository historialEstadoRepository;
    private final PedidoService pedidoService;
    private final PasswordEncoder passwordEncoder;

    public ClienteDemoInitializer(JdbcTemplate jdbcTemplate,
                                  UsuarioRepository usuarioRepository,
                                  ClienteRepository clienteRepository,
                                  PedidoRepository pedidoRepository,
                                  ProductoRepository productoRepository,
                                  EstadoPedidoRepository estadoPedidoRepository,
                                  HistorialEstadoRepository historialEstadoRepository,
                                  PedidoService pedidoService,
                                  PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.usuarioRepository = usuarioRepository;
        this.clienteRepository = clienteRepository;
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.estadoPedidoRepository = estadoPedidoRepository;
        this.historialEstadoRepository = historialEstadoRepository;
        this.pedidoService = pedidoService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        prepararCompatibilidadBaseDatos();
        asegurarUsuarioDemo("Administrador", "admin@importsmart.com", "admin123", Usuario.RolUsuario.ADMINISTRADOR, null);
        asegurarUsuarioDemo("Operador", "operador@importsmart.com", "operador123", Usuario.RolUsuario.OPERADOR, null);

        Cliente cliente = clienteRepository.findById(1L)
                .orElseGet(() -> clienteRepository.findAll().stream().findFirst().orElseGet(this::crearClienteDemo));

        asegurarUsuarioDemo(cliente.getNombre(), "cliente@importsmart.com", "cliente123", Usuario.RolUsuario.CLIENTE, cliente);

        asegurarPedidosClienteDemo(cliente);
        normalizarPedidosCliente(cliente);
    }

    private void prepararCompatibilidadBaseDatos() {
        ejecutarSqlSeguro("ALTER TABLE usuarios MODIFY COLUMN rol VARCHAR(20) NOT NULL");
        ejecutarSqlSeguro("ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cliente_id BIGINT NULL");
    }

    private void ejecutarSqlSeguro(String sql) {
        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ex) {
            log.debug("No se aplico ajuste automatico de base de datos: {}", sql, ex);
        }
    }

    private Cliente crearClienteDemo() {
        Cliente cliente = new Cliente();
        cliente.setNumeroCliente("CL0001");
        cliente.setNombre("TecnoAndes S.A.");
        cliente.setContacto("Cliente demo");
        cliente.setEmail("cliente@importsmart.com");
        cliente.setTelefono("506-2222-0000");
        cliente.setPais("Costa Rica");
        cliente.setDireccion("San Jose, Costa Rica");
        return clienteRepository.save(cliente);
    }

    private void asegurarUsuarioDemo(String nombre, String email, String password, Usuario.RolUsuario rol, Cliente cliente) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email).orElseGet(Usuario::new);
        usuario.setNombre(nombre);
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuario.setRol(rol);
        usuario.setCliente(cliente);
        usuario.setActivo(true);
        usuarioRepository.save(usuario);
    }

    private void asegurarPedidosClienteDemo(Cliente cliente) {
        List<Pedido> existentes = pedidoRepository.findByClienteIdOrderByFechaPedidoDesc(cliente.getId());
        int faltantes = Math.max(0, 6 - existentes.size());
        if (faltantes == 0) return;

        List<Producto> productos = productoRepository.findByActivoTrueOrderByNombreAsc();
        if (productos.size() < 2) return;

        for (int i = 0; i < faltantes; i++) {
            Producto p1 = productos.get((i * 2) % productos.size());
            Producto p2 = productos.get((i * 2 + 1) % productos.size());
            PedidoRequest req = new PedidoRequest();
            req.setClienteId(cliente.getId());
            req.setTipoEnvio(i % 2 == 0 ? "AEREO" : "MARITIMO");
            req.setDescripcion(p1.getNombre() + ", " + p2.getNombre());
            req.setDireccionEntrega(cliente.getDireccion());
            req.setGastosAdicionales(BigDecimal.valueOf(12 + (i * 3L)));
            req.getItems().add(item(p1, 1 + (i % 2)));
            req.getItems().add(item(p2, 1));
            req.getPaquetes().add(paquete(i, req.getTipoEnvio()));
            pedidoService.crear(req);
        }
    }

    private PedidoItemDTO item(Producto producto, int cantidad) {
        PedidoItemDTO dto = new PedidoItemDTO();
        dto.setProductoId(producto.getId());
        dto.setCantidad(cantidad);
        dto.setCostoUnitario(producto.getCostoUnitario());
        dto.setPrecioVenta(producto.getPrecioVenta());
        return dto;
    }

    private PaqueteDTO paquete(int i, String tipoEnvio) {
        PaqueteDTO dto = new PaqueteDTO();
        dto.setDescripcion("Paquete tracking " + (i + 1));
        dto.setLargoCm(BigDecimal.valueOf(tipoEnvio.equals("MARITIMO") ? 55 + i : 32 + i));
        dto.setAnchoCm(BigDecimal.valueOf(tipoEnvio.equals("MARITIMO") ? 42 + i : 24 + i));
        dto.setAltoCm(BigDecimal.valueOf(tipoEnvio.equals("MARITIMO") ? 38 + i : 18 + i));
        dto.setPesoRealKg(BigDecimal.valueOf(tipoEnvio.equals("MARITIMO") ? 18 + i : 4 + i));
        return dto;
    }

    private void normalizarPedidosCliente(Cliente cliente) {
        List<Pedido> pedidos = pedidoRepository.findByClienteIdOrderByFechaPedidoDesc(cliente.getId());
        String[] estadosDemo = {"Entregado", "En aduana", "En transito", "Aprobado", "Cotizado", "En bodega"};
        LocalDate hoy = LocalDate.now();
        for (int i = 0; i < pedidos.size(); i++) {
            Pedido pedido = pedidos.get(i);
            String estadoNombre = estadosDemo[i % estadosDemo.length];
            EstadoPedido estado = estadoPedidoRepository.findByNombreIgnoreCase(estadoNombre).orElse(null);
            if (estado != null) {
                pedido.setEstadoPedido(estado);
            }
            int ordenEstado = estado != null ? estado.getOrden() : 1;
            pedido.setFechaPedido(hoy.minusDays(Math.max(0, (ordenEstado - 1) * 2L)));
            pedido.setDireccionEntrega(pedido.getDireccionEntrega() != null && !pedido.getDireccionEntrega().isBlank()
                    ? pedido.getDireccionEntrega()
                    : cliente.getDireccion());
            pedido.setMontoPagado(pedido.getTotalVenta() == null ? BigDecimal.ZERO : pedido.getTotalVenta());
            Pedido guardado = pedidoRepository.save(pedido);
            reconstruirHistorial(guardado);
        }
    }

    private void reconstruirHistorial(Pedido pedido) {
        if (pedido.getEstadoPedido() == null || pedido.getFechaPedido() == null) return;
        List<HistorialEstado> actual = historialEstadoRepository.findByPedidoIdOrderByIdAsc(pedido.getId());
        historialEstadoRepository.deleteAll(actual);

        List<EstadoPedido> estados = estadoPedidoRepository.findAllByOrderByOrdenAsc();
        LocalDate fechaBase = pedido.getFechaPedido();
        int paso = 0;
        for (EstadoPedido estado : estados) {
            if (estado.getOrden() > pedido.getEstadoPedido().getOrden()) break;
            HistorialEstado h = new HistorialEstado();
            h.setPedido(pedido);
            h.setEstadoNombre(estado.getNombre());
            h.setNota("Tracking actualizado: " + estado.getNombre());
            h.setFecha(fechaBase.plusDays(paso * 2L));
            historialEstadoRepository.save(h);
            paso++;
        }
    }
}
