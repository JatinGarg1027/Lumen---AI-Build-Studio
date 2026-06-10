package com.distributed_lovable.workspace_service.mapper;

import com.distributed_lovable.workspace_service.dto.member.MemberResponse;
import com.distributed_lovable.workspace_service.entity.ProjectMember;

public interface ProjectMemberMapper  {

    MemberResponse toProjectMemberResponseFromMember(ProjectMember projectMember);

}
