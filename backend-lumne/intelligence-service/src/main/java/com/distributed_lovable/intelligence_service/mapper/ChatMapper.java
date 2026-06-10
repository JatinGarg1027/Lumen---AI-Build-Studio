package com.distributed_lovable.intelligence_service.mapper;

import com.distributed_lovable.intelligence_service.dto.chat.ChatResponse;
import com.distributed_lovable.intelligence_service.entity.ChatMessages;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ChatMapper {

    List<ChatResponse> fromListOfChatMessage(List<ChatMessages> chatMessagesList);
}
