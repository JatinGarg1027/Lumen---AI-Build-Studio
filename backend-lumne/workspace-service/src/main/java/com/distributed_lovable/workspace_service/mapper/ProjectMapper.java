package com.distributed_lovable.workspace_service.mapper;

import com.distributed_lovable.common_lib.enums.ProjectRole;
import com.distributed_lovable.workspace_service.dto.project.ProjectResponse;
import com.distributed_lovable.workspace_service.dto.project.ProjectSummaryResponse;
import com.distributed_lovable.workspace_service.entity.Project;

import java.util.List;

public interface ProjectMapper {

    ProjectResponse toProjectResponse(Project project); // just write the function definition that takes project type and sends back projectResponse rec

    ProjectSummaryResponse toProjectSummaryResponse(Project project, ProjectRole role);

    List<ProjectSummaryResponse> toListProjectSummaryResponse(List<Project> projects);
}

