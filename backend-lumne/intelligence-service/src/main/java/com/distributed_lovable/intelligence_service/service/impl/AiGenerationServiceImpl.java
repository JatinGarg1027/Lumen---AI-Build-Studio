package com.distributed_lovable.intelligence_service.service.impl;

import com.distributed_lovable.common_lib.enums.ChatEventStatus;
import com.distributed_lovable.common_lib.enums.ChatEventType;
import com.distributed_lovable.common_lib.enums.MessageRole;
import com.distributed_lovable.common_lib.event.FileStoreRequestEvent;
import com.distributed_lovable.common_lib.security.AuthUtil;
import com.distributed_lovable.intelligence_service.client.WorkspaceClient;
import com.distributed_lovable.intelligence_service.dto.chat.StreamResponse;
import com.distributed_lovable.intelligence_service.entity.ChatEvent;
import com.distributed_lovable.intelligence_service.entity.ChatMessages;
import com.distributed_lovable.intelligence_service.entity.ChatSession;
import com.distributed_lovable.intelligence_service.entity.ChatSessionId;
import com.distributed_lovable.intelligence_service.llm.CodeGenerationTools;
import com.distributed_lovable.intelligence_service.llm.FileTreeContextAdvisor;
import com.distributed_lovable.intelligence_service.llm.LlmResponseParser;
import com.distributed_lovable.intelligence_service.llm.PromptUtils;
import com.distributed_lovable.intelligence_service.repository.ChatEventRepository;
import com.distributed_lovable.intelligence_service.repository.ChatMessageRepository;
import com.distributed_lovable.intelligence_service.repository.ChatSessionRepository;
import com.distributed_lovable.intelligence_service.service.AiGenerationService;
import com.distributed_lovable.intelligence_service.service.UsageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

@Service
@Slf4j
@RequiredArgsConstructor
public class AiGenerationServiceImpl implements AiGenerationService {

    private final ChatClient chatClient;
    private final AuthUtil authUtil;
    private final FileTreeContextAdvisor fileTreeContextAdvisor;
    private final LlmResponseParser llmResponseParser;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatEventRepository chatEventRepository;
    private final UsageService usageService;
    private final WorkspaceClient workspaceClient;
    private final KafkaTemplate<String,Object> kafkaTemplate;

//    @Override
//    @PreAuthorize("@security.canViewProject(#projectId)") // userid will be taken from security context
//    public Flux<StreamResponse> streamResponse(String userMessage, Long projectId) {
//
//        //  usageService.checkDailyTokensUsage(); // won't allow generation if limit reached
//
//        Long userId=authUtil.getCurrentUserId();
//        ChatSession chatSession= createChatSessionIfNotExists(projectId,userId); // this auto create chat session just like in chatGpt
//
//        Map<String,Object> advisorParams=Map.of("userId",userId,"projectId",projectId);
//
//        StringBuilder fullResponseBuffer=new StringBuilder();
//
//        CodeGenerationTools codeGenerationTools=new CodeGenerationTools(projectId,workspaceClient);
//
//        AtomicReference<Long> startTime=new AtomicReference<>(System.currentTimeMillis()); // To show the thinking for 5 sec etc ... as a response
//        AtomicReference<Long> endTime =new AtomicReference<>(0L); // keeps end time in this thread only if new threads are present
//        AtomicReference<Usage> usageRef = new AtomicReference<>();
//
//        return chatClient.prompt()
//                .system(PromptUtils.CODE_GENERATION_SYSTEM_PROMPT) // you need to make this code_Generation_system_prompt as static if u want to put it here
//                .advisors(advisorSpec -> {
//                    advisorSpec.params(advisorParams);
//                    advisorSpec.advisors(fileTreeContextAdvisor);
//                })
//                .tools(codeGenerationTools)
//                .user(userMessage)
//                .stream()  // so we send streams not just one answer
//                .chatResponse()// has many things like tools and other info but we just need the text back
//                .doOnNext(response->{ // when on next chunk of same response
//
//                    if (response.getResult() == null || response.getResult().getOutput() == null) {
//                        return;
//                    }
//                    String content=response.getResult().getOutput().getText(); // its like i am can be first response then ayush 2nd I am a coder will be 3rd and so on so we will keep appending these chunks to string buider below
//                    if(content != null && !content.isEmpty() && endTime.get()==0) // first non empty chunk received on doFirst u can get empty chunk as well
//                    {
//                        endTime.set(System.currentTimeMillis());
//                    }
//                    if(response.getMetadata()!=null && response.getMetadata().getUsage()!=null)
//                    {
//                        usageRef.set(response.getMetadata().getUsage());
//                    }
//                    if (content != null && !content.isEmpty()) {
//                        fullResponseBuffer.append(content);
//                    }
//                })
//                .doOnComplete(()->{ // when llm stop sending text that is all chunks are received for the current response
//                    Schedulers.boundedElastic().schedule(()->{ // this function creates a seperate thread to perform the below function as below function is heavy and require resources
////                        parseAndSaveFiles(fullResponseBuffer.toString(),projectId);
//
//                        long duration = (endTime.get()-startTime.get())/1000;
//                        finalizeChats(userMessage,chatSession,fullResponseBuffer.toString(),duration,usageRef.get());
//                    });
//
//                })
//                .doOnError(error->log.error("Error during Streaming for projectId {}", projectId,error))
//                .map(response->{
//                    if (response.getResult() == null || response.getResult().getOutput() == null) {
//                        return new StreamResponse("");
//                    }
//                    String text= response.getResult().getOutput().getText();
//                    if (text == null || text.isEmpty()) {
//                        return null;
//                    }
//                    return  new StreamResponse(text);
//                })
//                .filter(Objects::nonNull);
//
//
//    }


    @Override
    @PreAuthorize("@security.canViewProject(#projectId)") // userid will be taken from security context
    public Flux<StreamResponse> streamResponse(String userMessage, Long projectId) {

        //  usageService.checkDailyTokensUsage(); // won't allow generation if limit reached

        Long userId=authUtil.getCurrentUserId();
        ChatSession chatSession= createChatSessionIfNotExists(projectId,userId); // this auto create chat session just like in chatGpt

        Map<String,Object> advisorParams=Map.of("userId",userId,"projectId",projectId);

        StringBuilder fullResponseBuffer=new StringBuilder();

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CodeGenerationTools codeGenerationTools=new CodeGenerationTools(projectId,workspaceClient,authentication);

        AtomicReference<Long> startTime=new AtomicReference<>(System.currentTimeMillis()); // To show the thinking for 5 sec etc ... as a response
        AtomicReference<Long> endTime =new AtomicReference<>(0L); // keeps end time in this thread only if new threads are present
        AtomicReference<Usage> usageRef = new AtomicReference<>();

        return chatClient.prompt()
                .system(PromptUtils.CODE_GENERATION_SYSTEM_PROMPT) // you need to make this code_Generation_system_prompt as static if u want to put it here
                .advisors(advisorSpec -> {
                    advisorSpec.params(advisorParams);
                    advisorSpec.advisors(fileTreeContextAdvisor);
                })
                .tools(codeGenerationTools)
                .user(userMessage)
                .stream()  // so we send streams not just one answer
                .chatResponse()// has many things like tools and other info but we just need the text back
                .doOnNext(response->{ // when on next chunk of same response
                    if (response.getResults() != null && !response.getResults().isEmpty()) {
                        var result = response.getResult();
                        if (result != null && result.getOutput() != null) {
                            String content = result.getOutput().getText();
                            if (content != null && !content.isEmpty()) {
                                if (endTime.get() == 0) {
                                    endTime.set(System.currentTimeMillis());
                                }
                                fullResponseBuffer.append(content);
                            }
                        }
                    }
                    if (response.getMetadata() != null && response.getMetadata().getUsage() != null) {
                        usageRef.set(response.getMetadata().getUsage());
                    }
                })
                .doOnComplete(()->{ // when llm stop sending text that is all chunks are received for the current response
                    Schedulers.boundedElastic().schedule(()->{ // this function creates a seperate thread to perform the below function as below function is heavy and require resources
//                        parseAndSaveFiles(fullResponseBuffer.toString(),projectId);

                        long duration = (endTime.get()-startTime.get())/1000;
                        finalizeChats(userMessage,chatSession,fullResponseBuffer.toString(),duration,usageRef.get(),userId);
                    });

                })
                .doOnError(error->log.error("Error during Streaming for projectId {}", projectId+""+error))
                .map(response->{
                    if (response.getResults() != null && !response.getResults().isEmpty()) {
                        var result = response.getResult();
                        if (result != null && result.getOutput() != null) {
                            String text = result.getOutput().getText();
                            return new StreamResponse(text != null ? text : "");
                        }
                    }
                    return new StreamResponse("");
                });


//                .filter(chatResponse -> chatResponse.getResult().getOutput().getText()!=null)
//                .handle((resp, sink) -> {
//                    var result = resp != null ? resp.getResult() : null;
//                    var output = result != null ? result.getOutput() : null;
//                    var text   = output != null ? output.getText() : null;
//
//                    if (text != null && !text.isEmpty()) {
//                        sink.next(new StreamResponse(text));
//                    }
//                    // else: ignore non-text events
//                });


    }

    private void finalizeChats(String userMessage , ChatSession chatSession ,String fullText,Long duration,Usage usage,Long userId){
        Long projectId=chatSession.getId().getProjectId();
        int promptTokens = 0;
        int completionTokens = 0;

        if (usage != null) {
            promptTokens = usage.getPromptTokens();
            completionTokens = usage.getCompletionTokens();
            int totalTokens = usage.getTotalTokens();
            usageService.recordTokenUsage(chatSession.getId().getUserId(), totalTokens);
        }

        //save the User Message
        chatMessageRepository.save(
                ChatMessages.builder()
                        .chatSession(chatSession)
                        .role(MessageRole.USER)
                        .content(userMessage)
                        .tokensUsed(promptTokens)
                        .build()
        );

        ChatMessages assistantChatMessage=ChatMessages.builder()
                .role(MessageRole.ASSISTANT)
                .content("Assistant Message here .....")
                .chatSession(chatSession)
                .tokensUsed(completionTokens)
                .build();

        assistantChatMessage=chatMessageRepository.save(assistantChatMessage);

        List<ChatEvent> chatEventList = llmResponseParser.parseChatEvents(fullText,assistantChatMessage);
        chatEventList.addFirst(ChatEvent.builder()
                        .type(ChatEventType.THOUGHT)
                        .status(ChatEventStatus.CONFIRMED)
                        .chatMessage(assistantChatMessage)
                        .content("Thought for "+duration+"s")
                        .sequenceOrder(0) // as rest starts from 1
                        .build());

        chatEventList.stream()
                .filter(e -> e.getType() == ChatEventType.FILE_EDIT)
                .forEach(e -> {
                    String sagaId = UUID.randomUUID().toString();
                    e.setSagaId(sagaId);
                    FileStoreRequestEvent fileStoreRequestEvent = new FileStoreRequestEvent(
                            projectId,
                            sagaId,
                            e.getFilePath(),
                            e.getContent(),
                            userId
                    );
                    log.info("Storage request event sent: {}", e.getFilePath());
                    kafkaTemplate.send("file-storage-request-event", "project-"+projectId, fileStoreRequestEvent);
                });

        chatEventRepository.saveAll(chatEventList);


    }


    private ChatSession createChatSessionIfNotExists(Long projectId, Long userId) {

        ChatSessionId chatSessionId =new ChatSessionId(projectId,userId);
        ChatSession chatSession=chatSessionRepository.findById(chatSessionId).orElse(null);

        if(chatSession==null)
        {

            chatSession =ChatSession.builder()
                    .id(chatSessionId)
                    .build();

            chatSession=chatSessionRepository.save(chatSession);
        }
        return chatSession;
    }
}
