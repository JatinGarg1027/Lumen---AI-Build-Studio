package com.distributed_lovable.workspace_service.controller;

import com.distributed_lovable.workspace_service.dto.member.InviteMemberRequest;
import com.distributed_lovable.workspace_service.dto.member.MemberResponse;
import com.distributed_lovable.workspace_service.dto.member.UpdateMemberRoleRequest;
import com.distributed_lovable.workspace_service.service.ProjectMemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/projects/{projectId}/members")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberServiceObj;


    @GetMapping
    public ResponseEntity<List<MemberResponse>> getProjectMembers(@PathVariable Long projectId){

        return ResponseEntity.ok(projectMemberServiceObj.getProjectMembers(projectId));

    }

    @PostMapping
    public ResponseEntity<MemberResponse> inviteMember(
            @PathVariable Long projectId,
            @RequestBody @Valid InviteMemberRequest request
    ){

        return ResponseEntity.status(HttpStatus.CREATED).body(
                projectMemberServiceObj.inviteMember(projectId,request)
        );
    }

    @PatchMapping("/{memberId}")
    public ResponseEntity<MemberResponse> updateMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long memberId,
            @RequestBody @Valid UpdateMemberRoleRequest request
    ){

        return ResponseEntity.ok(projectMemberServiceObj.updateMemberRole(projectId,memberId,request));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> deleteMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long memberId

    ){

        projectMemberServiceObj.removeProjectMember(projectId,memberId);
        return ResponseEntity.noContent().build();
    }

}
