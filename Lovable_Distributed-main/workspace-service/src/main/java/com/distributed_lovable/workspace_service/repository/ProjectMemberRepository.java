package com.distributed_lovable.workspace_service.repository;

import com.distributed_lovable.common_lib.enums.ProjectRole;
import com.distributed_lovable.workspace_service.entity.ProjectMember;
import com.distributed_lovable.workspace_service.entity.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

    List<ProjectMember> findByIdProjectId(Long projectId);  // findByIdProjectId means go inside projectMember and find by id (project meeber has two ids userId,projectId) ie find those project members only who have there project id inside id as project id


    @Query("""
            SELECT pm.projectRole FROM ProjectMember pm 
            WHERE pm.id.projectId= :projectId AND pm.id.userId= :userId
            """)
    Optional<ProjectRole> findRoleByProjectIdAndUserId(@Param("projectId") Long projectId,
                                                       @Param("userId")Long userId);


    @Query("""
            SELECT COUNT(pm) FROM ProjectMember pm
            WHERE pm.id.userId = :userId AND pm.projectRole= 'OWNER'
            """) // this query tells us the number of project of which this user is owner of
    int countProjectOwnedByUser(@Param("userId") Long userId);





}
