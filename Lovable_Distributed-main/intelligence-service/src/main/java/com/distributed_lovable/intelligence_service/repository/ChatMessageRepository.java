package com.distributed_lovable.intelligence_service.repository;

import com.distributed_lovable.intelligence_service.entity.ChatMessages;
import com.distributed_lovable.intelligence_service.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessages,Long> {

    // below query to prevent n+1 query problem

    @Query(
            """
            SELECT DISTINCT m FROM ChatMessages m
            LEFT JOIN FETCH m.events e
            WHERE m.chatSession = :chatSession
            ORDER BY m.createdAt ASC , e.sequenceOrder ASC
            """
    )
    List<ChatMessages> findByChatSession(ChatSession chatSession);

}
