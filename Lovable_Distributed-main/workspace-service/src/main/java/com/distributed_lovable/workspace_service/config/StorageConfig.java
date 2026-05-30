package com.distributed_lovable.workspace_service.config;

import io.minio.MinioClient;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Data
@ConfigurationProperties(prefix = "minio") // so i dont have to use @Value to get username password from yaml
public class StorageConfig {

    private String url;
    private String accessKey; // in yaml use kebab case and here the same spelling with camel case
    private String secretKey;

    @Bean
    public MinioClient minioClient()
    {
        return MinioClient.builder()
                .endpoint(url)
                .credentials(accessKey,secretKey)
                .build();
    }
}
