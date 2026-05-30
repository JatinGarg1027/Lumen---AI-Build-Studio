package com.distributed_lovable.workspace_service.service.impl;

import com.distributed_lovable.common_lib.dto.UserDto;
import com.distributed_lovable.common_lib.errors.ResourceNotFoundException;
import com.distributed_lovable.common_lib.security.AuthUtil;
import com.distributed_lovable.workspace_service.client.AccountClient;
import com.distributed_lovable.workspace_service.dto.member.InviteMemberRequest;
import com.distributed_lovable.workspace_service.dto.member.MemberResponse;
import com.distributed_lovable.workspace_service.dto.member.UpdateMemberRoleRequest;
import com.distributed_lovable.workspace_service.entity.Project;
import com.distributed_lovable.workspace_service.entity.ProjectMember;
import com.distributed_lovable.workspace_service.entity.ProjectMemberId;
import com.distributed_lovable.workspace_service.mapper.ProjectMemberMapper;
import com.distributed_lovable.workspace_service.repository.ProjectMemberRepository;
import com.distributed_lovable.workspace_service.repository.ProjectRepository;
import com.distributed_lovable.workspace_service.service.ProjectMemberService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor // so no need to constructor DI or Autowired
@Transactional
public class ProjectMemberServiceImpl implements ProjectMemberService {

    ProjectMemberRepository projectMemberRepositoryObj;
    ProjectRepository projectRepositoryObj;
    ProjectMemberMapper projectMemberMapper;
    AuthUtil authUtil;
    AccountClient accountClient;


    @Override
    @PreAuthorize("@security.canViewMembers(#projectId)") // this is spel language
    public List<MemberResponse> getProjectMembers(Long projectId) {
        // in this person we want all member of the given projectId , the userId in paramater above the the id of user requesting to see the projectMember of th given project id you need to authorise this id whether he should be allowed to see the members of project or not
        Long userId= authUtil.getCurrentUserId();

        return projectMemberRepositoryObj.findByIdProjectId(projectId)
                        .stream()
                        .map(projectMemberMapper::toProjectMemberResponseFromMember)
                        .toList();


    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)") // this is spel language
    public MemberResponse inviteMember(Long projectId, InviteMemberRequest request) {
        Long userId= authUtil.getCurrentUserId();
        Project project = getAccessibleProjectById(projectId, userId); // first finding the project //to find owner and see whether he is the one asking for the task or not


        UserDto invitee = accountClient.getUserByEmail(request.username()).orElseThrow(
                ()-> new ResourceNotFoundException("User",request.username())
        ); // to get thr credential of user that is been invited from the request body

        if(invitee.id().equals(userId)) // if user is inviting himself throw an error
        {
            throw new RuntimeException("Cannot invite yourself");
        }

        ProjectMemberId projectMemberId=new ProjectMemberId(projectId,invitee.id());
        if(projectMemberRepositoryObj.existsById(projectMemberId)) // if user is already in project dont add
        {
            throw new RuntimeException("Canot invite again as he is already in project");
        }

        //now add it after creating the project member

        ProjectMember member=ProjectMember.builder()
                .id(projectMemberId)
                .project(project)
                .projectRole(request.role())
                .invitedAt(Instant.now())
                .build();

        projectMemberRepositoryObj.save(member);

        return projectMemberMapper.toProjectMemberResponseFromMember(member);


    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)")
    public MemberResponse updateMemberRole(Long projectId, Long memberId, UpdateMemberRoleRequest request) {
        Long userId= authUtil.getCurrentUserId();
        Project project = getAccessibleProjectById(projectId, userId); // first finding the project //to find owner and see whether he is the one asking for the task or not



        ProjectMemberId projectMemberId=new ProjectMemberId(projectId,memberId);
        ProjectMember projectMember=projectMemberRepositoryObj.findById(projectMemberId).orElseThrow();

        projectMember.setProjectRole(request.role());

        projectMemberRepositoryObj.save(projectMember); // Not needed as @Transactional will keep care of it but good practice to write it


        return projectMemberMapper.toProjectMemberResponseFromMember(projectMember);
    }

    @Override
    @PreAuthorize("@security.canManageMembers(#projectId)")
    public void removeProjectMember(Long projectId, Long memberId) {
        Long userId= authUtil.getCurrentUserId();
        Project project = getAccessibleProjectById(projectId, userId); // first finding the project //to find owner and see whether he is the one asking for the task or not


        ProjectMemberId projectMemberId=new ProjectMemberId(projectId,memberId);
        if(!projectMemberRepositoryObj.existsById(projectMemberId))
        {
            throw new RuntimeException("Member Not Present");
        }
        projectMemberRepositoryObj.deleteById(projectMemberId);


    }

    /// / internal function
    public Project getAccessibleProjectById(Long projectId, Long userId) {
        return projectRepositoryObj.findAccessibleProjectById(projectId, userId).orElseThrow();
    }
}
