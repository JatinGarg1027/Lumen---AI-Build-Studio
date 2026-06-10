package com.distributed_lovable.workspace_service.mapper;

import com.distributed_lovable.common_lib.enums.ProjectRole;
import com.distributed_lovable.workspace_service.dto.project.ProjectResponse;
import com.distributed_lovable.workspace_service.dto.project.ProjectSummaryResponse;
import com.distributed_lovable.workspace_service.entity.Project;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Component
public class ProjectMapperImpl implements ProjectMapper {

    @Override
    public ProjectResponse toProjectResponse(Project project) {
        if (project == null) {
            return null;
        }

        Long id = project.getId();
        String name = project.getName();
        Instant createdAt = project.getCreatedAt();
        Instant updatedAt = project.getUpdatedAt();

        return new ProjectResponse(id, name, createdAt, updatedAt);
    }

    @Override
    public ProjectSummaryResponse toProjectSummaryResponse(Project project, ProjectRole role) {
        if (project == null && role == null) {
            return null;
        }

        Long id = null;
        String name = null;
        Instant createdAt = null;
        Instant updatedAt = null;

        if (project != null) {
            id = project.getId();
            name = project.getName();
            createdAt = project.getCreatedAt();
            updatedAt = project.getUpdatedAt();
        }

        return new ProjectSummaryResponse(id, name, createdAt, updatedAt, role);
    }

    @Override
    public List<ProjectSummaryResponse> toListProjectSummaryResponse(List<Project> projects) {
        if (projects == null) {
            return null;
        }

        List<ProjectSummaryResponse> list = new ArrayList<>(projects.size());
        for (Project project : projects) {
            list.add(projectToProjectSummaryResponse(project));
        }

        return list;
    }

    protected ProjectSummaryResponse projectToProjectSummaryResponse(Project project) {
        if (project == null) {
            return null;
        }

        Long id = project.getId();
        String name = project.getName();
        Instant createdAt = project.getCreatedAt();
        Instant updatedAt = project.getUpdatedAt();

        return new ProjectSummaryResponse(id, name, createdAt, updatedAt, null);
    }
}
