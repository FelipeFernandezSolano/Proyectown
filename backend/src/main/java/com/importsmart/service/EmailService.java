package com.importsmart.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String remitente;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /** Envia el enlace de recuperacion de contraseña. Si SMTP no esta configurado, lo registra en el log. */
    public void enviarRecuperacionContrasena(String destinatario, String enlaceRecuperacion) {
        if (remitente == null || remitente.isBlank()) {
            log.warn("SMTP no configurado (MAIL_USERNAME/MAIL_PASSWORD). Enlace de recuperacion para {}: {}",
                    destinatario, enlaceRecuperacion);
            return;
        }

        try {
            SimpleMailMessage mensaje = new SimpleMailMessage();
            mensaje.setFrom(remitente);
            mensaje.setTo(destinatario);
            mensaje.setSubject("ImportSmart - Restablecer tu contraseña");
            mensaje.setText(
                    "Recibimos una solicitud para restablecer tu contraseña.\n\n" +
                    "Para continuar, abre este enlace (valido por 1 hora):\n" + enlaceRecuperacion +
                    "\n\nSi no solicitaste este cambio, puedes ignorar este correo."
            );
            mailSender.send(mensaje);
        } catch (Exception ex) {
            log.error("No se pudo enviar el correo de recuperacion a {}. Enlace: {}", destinatario, enlaceRecuperacion, ex);
        }
    }
}
