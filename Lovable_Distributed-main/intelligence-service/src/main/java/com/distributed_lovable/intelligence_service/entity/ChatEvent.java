package com.distributed_lovable.intelligence_service.entity;

import com.distributed_lovable.common_lib.enums.ChatEventStatus;
import com.distributed_lovable.common_lib.enums.ChatEventType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@Entity
@Table(name = "chat_events")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatEvent {

    // multiple things inside one chat message


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    ChatMessages chatMessage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    ChatEventType type;

    @Column(nullable = false)
    Integer sequenceOrder;

    @Column(columnDefinition = "text") // so that it knows it can have large values of text
    String content;

    String filePath;

    @Column(columnDefinition = "text") // so that it knows it can have large values of text
    String metadata;

    String sagaId;

    @Enumerated(EnumType.STRING)
//    @Column(nullable = false)
    ChatEventStatus status;

}
