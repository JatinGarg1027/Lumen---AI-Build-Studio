package com.distributed_lovable.workspace_service.service.impl;

import com.distributed_lovable.common_lib.dto.FileNode;
import com.distributed_lovable.common_lib.dto.FileTreeDto;
import com.distributed_lovable.common_lib.errors.ResourceNotFoundException;
import com.distributed_lovable.workspace_service.entity.Project;
import com.distributed_lovable.workspace_service.entity.ProjectFile;
import com.distributed_lovable.workspace_service.mapper.ProjectFileMapper;
import com.distributed_lovable.workspace_service.repository.ProjectFileRepository;
import com.distributed_lovable.workspace_service.repository.ProjectRepository;
import com.distributed_lovable.workspace_service.service.ProjectFileService;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProjectFileServiceImpl implements ProjectFileService {

    private final ProjectFileRepository projectFileRepository;
    private final ProjectRepository projectRepository;
    private final MinioClient minioClient;
    private final ProjectFileMapper projectFileMapper;
    private static final String BUCKET_NAME= "projects";

    @Value("${minio.project-bucket}")
    private String projectBucket;


    @Override
    public FileTreeDto getFileTree(Long projectId) {
        List<ProjectFile> projectFileList=projectFileRepository.findByProjectId(projectId);
        List<FileNode> projectFileNodes = projectFileMapper.toListOfFileNode(projectFileList);
        return new FileTreeDto(projectFileNodes);
    }

    @Override
    public String getFileContent(Long projectId, String path) {
        String objectName = projectId + "/" + path;
        try (
                InputStream is = minioClient.getObject(
                        GetObjectArgs.builder()
                                .bucket(BUCKET_NAME)
                                .object(objectName)
                                .build())) {

            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to read file: {}/{}", projectId, path, e);
            throw new RuntimeException("Failed to read file content", e);
        }
    }

    @Override
    @Transactional
    public void saveFile(Long projectId, String path, String content) {

        Project project=projectRepository.findById(projectId).orElseThrow(
                ()-> new ResourceNotFoundException("Project",projectId.toString())
        );

        //Now get the path of the file remove starting / if it was put by llm first
        String cleanPath= path.startsWith("/")?path.substring(1):path;
        String objectKey=projectId+"/"+cleanPath; // ex 2/src/App.jsx etc

        try { // got from minio doc
            byte[] contentBytes = content.getBytes(StandardCharsets.UTF_8); // converting content to byte stream so that u can even process images
            InputStream inputStream = new ByteArrayInputStream(contentBytes); // then convert to input stream
            // saving the file content in minio
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(projectBucket)
                            .object(objectKey)
                            .stream(inputStream, contentBytes.length, -1)
                            .contentType(determineContentType(path))
                            .build());

            // Saving the metaData
            ProjectFile file = projectFileRepository.findByProjectIdAndPath(projectId, cleanPath)
                    .orElseGet(() -> ProjectFile.builder() // if it exist we get it else run .builder() and generate the new file
                            .project(project)
                            .path(cleanPath)
                            .minioObjectKey(objectKey) // Use the key we generated
                            .createdAt(Instant.now())
                            .build());

            file.setUpdatedAt(Instant.now()); // if file already exist then just update the updated file
            projectFileRepository.save(file);

            log.info("Saved file: {}", objectKey);
        } catch (Exception e) {
            log.error("Failed to save file {}/{}", projectId, cleanPath, e);
            throw new RuntimeException("File save failed", e);
        }



    }
    private String determineContentType(String path) {
        String type = URLConnection.guessContentTypeFromName(path);
        if (type != null) return type;
        if (path.endsWith(".jsx") || path.endsWith(".ts") || path.endsWith(".tsx")) return "text/javascript";
        if (path.endsWith(".json")) return "application/json";
        if (path.endsWith(".css")) return "text/css";

        return "text/plain";
    }
}
