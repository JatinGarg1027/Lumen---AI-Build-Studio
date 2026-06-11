package com.distributed_lovable.workspace_service.config;

import io.fabric8.kubernetes.client.Config;
import io.fabric8.kubernetes.client.ConfigBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
public class KubernetesConfig {

    @Bean
    @Profile("k8s")
    public KubernetesClient kubernetesClient() {
        return new KubernetesClientBuilder().build();
    }

    @Bean
    @Profile("!k8s")
    public KubernetesClient localKubernetesClient() {
        Config emptyConfig = new ConfigBuilder(Config.empty()).build();
        return new KubernetesClientBuilder().withConfig(emptyConfig).build();
    }
}
