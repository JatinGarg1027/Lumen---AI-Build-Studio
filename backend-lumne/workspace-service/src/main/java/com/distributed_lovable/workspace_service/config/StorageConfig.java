package com.distributed_lovable.workspace_service.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import lombok.Data;
import org.springframework.boot.CommandLineRunner;
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

    @Bean
    public CommandLineRunner initMinio(MinioClient minioClient) {
        return args -> {
            try {
                String[] buckets = {"projects", "starter-projects"};
                for (String bucket : buckets) {
                    boolean exists = minioClient.bucketExists(
                            BucketExistsArgs.builder().bucket(bucket).build()
                    );
                    if (!exists) {
                        minioClient.makeBucket(
                                MakeBucketArgs.builder().bucket(bucket).build()
                        );
                        System.out.println("Created MinIO bucket: " + bucket);
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to initialize MinIO buckets: " + e.getMessage());
            }
        };
    }
}
