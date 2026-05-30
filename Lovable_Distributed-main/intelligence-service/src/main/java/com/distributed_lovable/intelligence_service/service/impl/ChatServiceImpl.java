package com.distributed_lovable.intelligence_service.service.impl;

import com.distributed_lovable.common_lib.security.AuthUtil;
import com.distributed_lovable.intelligence_service.dto.chat.ChatResponse;
import com.distributed_lovable.intelligence_service.entity.ChatMessages;
import com.distributed_lovable.intelligence_service.entity.ChatSession;
import com.distributed_lovable.intelligence_service.entity.ChatSessionId;
import com.distributed_lovable.intelligence_service.mapper.ChatMapper;
import com.distributed_lovable.intelligence_service.repository.ChatMessageRepository;
import com.distributed_lovable.intelligence_service.repository.ChatSessionRepository;
import com.distributed_lovable.intelligence_service.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepositoryObj;
    private final AuthUtil authUtil;
    private final ChatSessionRepository chatSessionRepositoryObj;
    private final ChatMapper chatMapper;

    @Override
    public List<ChatResponse> getProjectChatHistory(Long projectId) {

        Long userId= authUtil.getCurrentUserId();

        ChatSession chatSession=chatSessionRepositoryObj.getReferenceById(
                new ChatSessionId(projectId,userId)
        );

        List<ChatMessages> chatMessagesList=chatMessageRepositoryObj.findByChatSession(chatSession);
        return chatMapper.fromListOfChatMessage(chatMessagesList);

    }
}
