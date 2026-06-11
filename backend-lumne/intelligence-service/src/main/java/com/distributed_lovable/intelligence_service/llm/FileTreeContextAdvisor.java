package com.distributed_lovable.intelligence_service.llm;

import com.distributed_lovable.common_lib.dto.FileNode;
import com.distributed_lovable.intelligence_service.client.WorkspaceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClientRequest;
import org.springframework.ai.chat.client.ChatClientResponse;
import org.springframework.ai.chat.client.advisor.api.StreamAdvisor;
import org.springframework.ai.chat.client.advisor.api.StreamAdvisorChain;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class FileTreeContextAdvisor implements StreamAdvisor {

    private final WorkspaceClient workspaceClient;



    //Every time you ask the chatbot a question, this advisor automatically adds the project’s file tree to the prompt before the LLM answers.
    @Override
    public Flux<ChatClientResponse> adviseStream(ChatClientRequest request, StreamAdvisorChain streamAdvisorChain) {

        Map<String,Object> context=request.context();
        Long projectId=Long.parseLong(context.getOrDefault("projectId",0).toString());

        ChatClientRequest augmentedChatClientRequest= augmentRequestWithFileTree(request,projectId);

        return streamAdvisorChain.nextStream(augmentedChatClientRequest);
    }

    private ChatClientRequest augmentRequestWithFileTree(ChatClientRequest request, Long projectId) {

        List<Message> incomingMessages = request.prompt().getInstructions();

        Message systemMessage = incomingMessages.stream()
                .filter(m -> m.getMessageType() == MessageType.SYSTEM)
                .findFirst()
                .orElse(null);

        List<Message> userMessages = incomingMessages.stream()
                .filter(m -> m.getMessageType() != MessageType.SYSTEM)
                .toList();

        List<Message> allMessages = new ArrayList<>();
        // Now add original system message
        if (systemMessage != null) {
            allMessages.add(systemMessage);
        }

        // Find the current active user prompt (the last user message in the chain)
        String userPrompt = "";
        for (int i = incomingMessages.size() - 1; i >= 0; i--) {
            Message msg = incomingMessages.get(i);
            if (msg.getMessageType() == MessageType.USER) {
                userPrompt = msg.getText();
                break;
            }
        }

        List<FileNode> fileTree = workspaceClient.getFileTree(projectId).files();
        
        // Scan file tree to see if any file names or paths are mentioned in the active user prompt
        List<String> filesToInject = new ArrayList<>();
        String lowerPrompt = userPrompt.toLowerCase();
        for (FileNode node : fileTree) {
            String path = node.path();
            if (path == null || path.endsWith("/")) continue; // skip directories
            String name = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
            
            if (lowerPrompt.contains(path.toLowerCase()) || lowerPrompt.contains(name.toLowerCase())) {
                filesToInject.add(path);
            }
        }

        // Fallback: If no specific files are mentioned, auto-inject src/App.tsx as it is the core React entry point
        if (filesToInject.isEmpty()) {
            for (FileNode node : fileTree) {
                if (node.path() != null && node.path().equals("src/App.tsx")) {
                    filesToInject.add("src/App.tsx");
                    break;
                }
            }
        }

        // Retrieve and format file contents
        StringBuilder contextBuilder = new StringBuilder();
        if (!filesToInject.isEmpty()) {
            contextBuilder.append("\n\n ---- FILE CONTENTS (AUTO-INJECTED CONTEXT) ----\n");
            for (String path : filesToInject) {
                try {
                    String content = workspaceClient.getFileContent(projectId, path);
                    contextBuilder.append(String.format("--- START OF FILE: %s ---\n%s\n--- END OF FILE ---\n\n", path, content));
                    log.info("Auto-injected file context for: {}", path);
                } catch (Exception e) {
                    log.warn("Failed to auto-inject file content for: {}, error: {}", path, e.getMessage());
                }
            }
        }

        // Inject the file tree representation
        String fileTreeContext = "\n\n ---- FILE_TREE ----\n" + fileTree.toString();
        allMessages.add(new SystemMessage(fileTreeContext));

        // Inject the actual file contents if any were matched/preloaded
        if (contextBuilder.length() > 0) {
            allMessages.add(new SystemMessage(contextBuilder.toString()));
        }

        allMessages.addAll(userMessages);

        return request.mutate()
                .prompt(new Prompt(allMessages, request.prompt().getOptions()))
                .build();

    }

    @Override
    public String getName() {
        return "FileTreeContextAdvisor";
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
