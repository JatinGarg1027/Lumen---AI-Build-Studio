package com.distributed_lovable.workspace_service.entity;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable // so that now this field can be embedded anywhere
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMemberId {
    Long projectId;
    Long userId;
}
