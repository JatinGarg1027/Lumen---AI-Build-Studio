package com.distributed_lovable.intelligence_service.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "chat_sessions")
public class ChatSession {

    @EmbeddedId
    private ChatSessionId id;


    @CreationTimestamp
    @Column(nullable = false,updatable = false)
    Instant createdAt;          // Instant is same as LocalDateTime with some extra functionality

    @UpdateTimestamp
    Instant updatedAt;

    Instant deletedAt;//soft delete

}
