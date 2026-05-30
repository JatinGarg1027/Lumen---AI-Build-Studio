package com.distributed_lovable.workspace_service.mapper;

import com.distributed_lovable.common_lib.enums.ProjectRole;
import com.distributed_lovable.workspace_service.dto.project.ProjectResponse;
import com.distributed_lovable.workspace_service.dto.project.ProjectSummaryResponse;
import com.distributed_lovable.workspace_service.entity.Project;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring") // specifically making component model as spring as Mapper work with even normal java code so its important to mention that its for spring
public interface ProjectMapper {

    ProjectResponse toProjectResponse(Project project); // just write the function definition that takes project type and sends back projectResponse rec

    ProjectSummaryResponse toProjectSummaryResponse(Project project, ProjectRole role);

    List<ProjectSummaryResponse> toListProjectSummaryResponse(List<Project> projects);
}

