package com.distributed_lovable.workspace_service.controller;

import com.distributed_lovable.workspace_service.dto.project.DeployResponse;
import com.distributed_lovable.workspace_service.dto.project.ProjectRequest;
import com.distributed_lovable.workspace_service.dto.project.ProjectResponse;
import com.distributed_lovable.workspace_service.dto.project.ProjectSummaryResponse;
import com.distributed_lovable.workspace_service.service.DeploymentService;
import com.distributed_lovable.workspace_service.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectServiceObj;
   private final DeploymentService deploymentService;

    @GetMapping
    public ResponseEntity<List<ProjectSummaryResponse>> getMyProjects() {

        return ResponseEntity.ok(projectServiceObj.getUserProjects());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectSummaryResponse> getProjectById(@PathVariable Long id){

        return ResponseEntity.ok(projectServiceObj.getUserProjectById(id));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(@RequestBody @Valid ProjectRequest request){

        return ResponseEntity.status(HttpStatus.CREATED).body(projectServiceObj.createProject(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long id,@RequestBody @Valid ProjectRequest request){

        return ResponseEntity.ok(projectServiceObj.updateProject(id,request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id){

        projectServiceObj.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/deploy")
    public ResponseEntity<DeployResponse> deployProject(@PathVariable Long id)
    {
        return ResponseEntity.ok(deploymentService.deploy(id));
    }



}
