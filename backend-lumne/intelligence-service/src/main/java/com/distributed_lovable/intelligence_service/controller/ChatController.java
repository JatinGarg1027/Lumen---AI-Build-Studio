package com.distributed_lovable.intelligence_service.controller;

import com.distributed_lovable.intelligence_service.dto.chat.ChatRequest;
import com.distributed_lovable.intelligence_service.dto.chat.ChatResponse;
import com.distributed_lovable.intelligence_service.dto.chat.StreamResponse;
import com.distributed_lovable.intelligence_service.service.AiGenerationService;
import com.distributed_lovable.intelligence_service.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final AiGenerationService aiGenerationService;
    private final ChatService chatService;

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    // This will help send data in stream rather than one go just like in chat gpt
    //openai dependency has two model either once or in stream
    public Flux<ServerSentEvent<StreamResponse>> streamChat(
            @RequestBody ChatRequest request
    )
    {
         return aiGenerationService.streamResponse(request.message(),request.projectId())
                 .map(data-> ServerSentEvent.<StreamResponse>builder()
                         .data(data)
                         .build());

    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<List<ChatResponse>> getChatHistory(
            @PathVariable String projectId
    )
    {
        return ResponseEntity.ok(chatService.getProjectChatHistory(Long.parseLong(projectId)));
    }

}

