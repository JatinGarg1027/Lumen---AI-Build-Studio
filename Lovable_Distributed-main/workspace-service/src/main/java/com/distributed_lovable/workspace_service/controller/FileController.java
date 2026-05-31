package com.distributed_lovable.workspace_service.controller;

import com.distributed_lovable.common_lib.dto.FileTreeDto;
import com.distributed_lovable.common_lib.dto.FileNode;
import com.distributed_lovable.workspace_service.service.ProjectFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@Slf4j
@RequiredArgsConstructor // generate objects using constructor now you dont need to write them
@RequestMapping("/projects/{projectId}/files")
public class FileController {

    private final ProjectFileService fileServiceObj;

    @GetMapping()
    public ResponseEntity<FileTreeDto>  getFileTree(@PathVariable Long projectId){
        log.info("Fetching file tree for project: {}", projectId);
        try {
            FileTreeDto result = fileServiceObj.getFileTree(projectId);
            log.info("Successfully loaded file tree with {} files", 
                result.files() != null ? result.files().size() : 0);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error loading file tree for project {}: {}", projectId, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/content") // * so that I can also get /src/hooks/AppHook.jsx //this get mapping will only work if there is something before path
    public ResponseEntity<String> getFile(
            @PathVariable Long projectId,
            @RequestParam String path
    )
    {
        log.info("Fetching file content for project: {}, path: {}", projectId, path);
        try {
            String content = fileServiceObj.getFileContent(projectId, path);
            log.info("Successfully loaded file {} with {} bytes", path, content.length());
            return ResponseEntity.ok(content);
        } catch (Exception e) {
            log.error("Error loading file content for project {}, path {}: {}", 
                projectId, path, e.getMessage(), e);
            throw e;
        }
    }

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugFileStatus(@PathVariable Long projectId) {
        log.info("Debug request for project: {}", projectId);
        Map<String, Object> debug = new HashMap<>();
        
        try {
            FileTreeDto fileTree = fileServiceObj.getFileTree(projectId);
            debug.put("projectId", projectId);
            debug.put("status", "success");
            debug.put("filesCount", fileTree.files() != null ? fileTree.files().size() : 0);
            debug.put("files", fileTree.files());
            debug.put("timestamp", System.currentTimeMillis());
            
            log.info("Debug info for project {}: {} files found", projectId, 
                fileTree.files() != null ? fileTree.files().size() : 0);
        } catch (Exception e) {
            debug.put("projectId", projectId);
            debug.put("status", "error");
            debug.put("error", e.getMessage());
            debug.put("errorType", e.getClass().getSimpleName());
            debug.put("timestamp", System.currentTimeMillis());
            
            log.error("Debug error for project {}: {}", projectId, e.getMessage(), e);
        }
        
        return ResponseEntity.ok(debug);
    }

    @GetMapping("/download-zip")
    public void downloadZip(
            @PathVariable Long projectId,
            jakarta.servlet.http.HttpServletResponse response
    ) throws java.io.IOException {
        log.info("Downloading ZIP for project: {}", projectId);
        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"project-" + projectId + ".zip\"");

        try (java.util.zip.ZipOutputStream zos = new java.util.zip.ZipOutputStream(response.getOutputStream())) {
            FileTreeDto fileTree = fileServiceObj.getFileTree(projectId);
            if (fileTree != null && fileTree.files() != null) {
                for (FileNode node : fileTree.files()) {
                    String path = node.path();
                    try {
                        String content = fileServiceObj.getFileContent(projectId, path);
                        java.util.zip.ZipEntry zipEntry = new java.util.zip.ZipEntry(path);
                        zos.putNextEntry(zipEntry);
                        zos.write(content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                        zos.closeEntry();
                    } catch (Exception e) {
                        log.error("Failed to add file {} to ZIP for project {}: {}", path, projectId, e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error creating ZIP for project {}: {}", projectId, e.getMessage(), e);
            throw e;
        }
    }

}
