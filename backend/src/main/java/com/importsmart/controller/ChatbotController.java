package com.importsmart.controller;

import com.importsmart.dto.ChatMensajeRequest;
import com.importsmart.dto.ChatRespuestaDTO;
import com.importsmart.service.ChatbotService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/** Endpoint publico (sin login) para el chatbot del landing. */
@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ChatRespuestaDTO preguntar(@Valid @RequestBody ChatMensajeRequest request) {
        return new ChatRespuestaDTO(chatbotService.responder(request));
    }
}
