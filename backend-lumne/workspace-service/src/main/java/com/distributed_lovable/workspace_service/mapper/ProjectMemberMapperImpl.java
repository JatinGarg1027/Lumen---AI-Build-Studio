package com.distributed_lovable.workspace_service.mapper;

import com.distributed_lovable.common_lib.enums.ProjectRole;
import com.distributed_lovable.workspace_service.dto.member.MemberResponse;
import com.distributed_lovable.workspace_service.entity.ProjectMember;
import com.distributed_lovable.workspace_service.entity.ProjectMemberId;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class ProjectMemberMapperImpl implements ProjectMemberMapper {

    @Override
    public MemberResponse toProjectMemberResponseFromMember(ProjectMember projectMember) {
        if (projectMember == null) {
            return null;
        }

        Long userId = projectMemberIdUserId(projectMember);
        ProjectRole projectRole = projectMember.getProjectRole();
        Instant invitedAt = projectMember.getInvitedAt();

        String username = null;
        String name = null;

        return new MemberResponse(userId, username, name, projectRole, invitedAt);
    }

    private Long projectMemberIdUserId(ProjectMember projectMember) {
        ProjectMemberId id = projectMember.getId();
        if (id == null) {
            return null;
        }
        return id.getUserId();
    }
}
