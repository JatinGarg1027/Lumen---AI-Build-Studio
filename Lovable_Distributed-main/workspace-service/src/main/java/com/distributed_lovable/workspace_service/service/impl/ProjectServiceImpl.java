package com.distributed_lovable.workspace_service.service.impl;

import com.distributed_lovable.common_lib.dto.PlanDto;
import com.distributed_lovable.common_lib.enums.ProjectPermission;
import com.distributed_lovable.common_lib.enums.ProjectRole;
import com.distributed_lovable.common_lib.errors.BadRequestException;
import com.distributed_lovable.common_lib.errors.ResourceNotFoundException;
import com.distributed_lovable.common_lib.security.AuthUtil;
import com.distributed_lovable.workspace_service.client.AccountClient;
import com.distributed_lovable.workspace_service.dto.project.ProjectRequest;
import com.distributed_lovable.workspace_service.dto.project.ProjectResponse;
import com.distributed_lovable.workspace_service.dto.project.ProjectSummaryResponse;
import com.distributed_lovable.workspace_service.entity.Project;
import com.distributed_lovable.workspace_service.entity.ProjectMember;
import com.distributed_lovable.workspace_service.entity.ProjectMemberId;
import com.distributed_lovable.workspace_service.mapper.ProjectMapper;
import com.distributed_lovable.workspace_service.repository.ProjectMemberRepository;
import com.distributed_lovable.workspace_service.repository.ProjectRepository;
import com.distributed_lovable.workspace_service.security.SecurityExpressions;
import com.distributed_lovable.workspace_service.service.ProjectService;
import com.distributed_lovable.workspace_service.service.ProjectTemplateService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true,level = AccessLevel.PRIVATE)
@Transactional // so that in any error we can rollback (used after mapper here) , also it commits the changes to db by dirty changes
public class ProjectServiceImpl implements ProjectService {

    ProjectRepository projectRepositoryObj;
    ProjectMapper projectMapper;
    AuthUtil authUtil;
    ProjectTemplateService projectTemplateService;
    AccountClient accountClient;
    ProjectMemberRepository projectMemberRepository;
    SecurityExpressions securityExpressions;
    @Override
    public ProjectResponse createProject(ProjectRequest request) {

        if(!canCreateProject()) // u can create if you have not reached the limit to create them ie 1 project for free plan 3 for pro 10 for business
        {
            throw new BadRequestException("User cannot create a new project with current plan please upgrade the plan");
        }

        Long ownerUserId= authUtil.getCurrentUserId();
//        User owner=userRepositoryObj.findById(userId).orElseThrow(
//                ()-> new ResourceNotFoundException("User",userId.toString())
//        );
        Project project=Project.builder()
                .name(request.name())
                .isPublic(false) // we need to specifically define false the default value we  defined in project as false wont work
                .build();



        project=projectRepositoryObj.save(project); // we cant use model mapper as it wont work for records (project response) so we will use map Struct
        // we use records as they are immutable and we dont need to write getter setter so it makes code less bulky

        ProjectMemberId projectMemberId=new ProjectMemberId(project.getId(), ownerUserId);
        ProjectMember projectMember=ProjectMember.builder()
                .id(projectMemberId)
                .projectRole(ProjectRole.OWNER)
                .acceptedAt(Instant.now())
                .invitedAt(Instant.now())
                .project(project)
                .build();
        projectMemberRepository.save(projectMember);
        projectTemplateService.initializeProjectFromTemplate(project.getId()); // to attach the premade template with this project in minio as soon as the project is created

        return projectMapper.toProjectResponse(project);
    }

    @Override
    public List<ProjectSummaryResponse> getUserProjects() {
        Long userId= authUtil.getCurrentUserId();
        var projectsWithRoles=projectRepositoryObj.findAllAccessibleByUser(userId);
        return projectsWithRoles.stream()
                .map(p-> projectMapper.toProjectSummaryResponse(p.getProject(),p.getRole()))
                .toList();

//        return projectRepositoryObj.findAllAccessibleByUser(userId)
//                .stream()
//             .map(project -> projectMapper.toProjectSummaryResponse(project)) // this line is same as below converted to lambda by compiler
//                .map(projectMapper::toProjectSummaryResponse)
//                .collect(Collectors.toList());
    }

    @Override
    @PreAuthorize("@security.canViewProject(#projectId)") // this is spel language
    public ProjectSummaryResponse getUserProjectById(Long projectId) { // here and below just id is project id
        Long userId= authUtil.getCurrentUserId();
        var projectWithRole=projectRepositoryObj.findAccessibleProjectByIdWithRole(projectId,userId)
                .orElseThrow(()-> new BadRequestException("Project Not Found"));
        return projectMapper.toProjectSummaryResponse(projectWithRole.getProject(),projectWithRole.getRole());
    }

    @Override
    @PreAuthorize("@security.canEditProject(#projectId)") // this is spel language
    public ProjectResponse updateProject(Long projectId, ProjectRequest request) {
        Long userId= authUtil.getCurrentUserId();
        Project project=getAccessibleProjectById(projectId,userId);



        project.setName(request.name());
        project=projectRepositoryObj.save(project);
        return projectMapper.toProjectResponse(project);
    }

    @Override
    @PreAuthorize("@security.canDeleteProject(#projectId)") // this is spel language
    public void softDelete(Long projectId) {
        Long userId= authUtil.getCurrentUserId();
        Project project=getAccessibleProjectById(projectId,userId);


        project.setDeletedAt(Instant.now());  // this is soft delete, if ever user want to take this project again then just set setDeletedAt to null
        projectRepositoryObj.save(project); // optional line since we have @transactional annotation
    }

    @Override
    public boolean hasPermission(Long projectId, ProjectPermission permission) {
        return securityExpressions.hasPermission(projectId,permission);
    }


    //// internal function
    public Project getAccessibleProjectById(Long projectId,Long userId)
    {
        return projectRepositoryObj.findAccessibleProjectById(projectId,userId)
                .orElseThrow(()-> new ResourceNotFoundException("Project",projectId.toString()));
    }

    private static final int FREE_TIER_MAX_PROJECTS = 100;

    private boolean canCreateProject() {
        Long userId = authUtil.getCurrentUserId();
        if (userId == null) {
            return false;
        }
        PlanDto plan = accountClient.getCurrentSubscribedPlanByUser();

        int maxAllowed = (plan != null) ? plan.maxProjects() : FREE_TIER_MAX_PROJECTS;
        int ownedCount = projectMemberRepository.countProjectOwnedByUser(userId);

        return ownedCount < maxAllowed;
    }
}
