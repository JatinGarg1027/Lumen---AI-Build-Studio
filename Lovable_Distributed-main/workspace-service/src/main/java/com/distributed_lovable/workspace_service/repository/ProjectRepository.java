package com.distributed_lovable.workspace_service.repository;

import com.distributed_lovable.common_lib.enums.ProjectRole;
import com.distributed_lovable.workspace_service.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project,Long> {

    @Query("""
            SELECT pm.project as project, pm.projectRole as role
            FROM ProjectMember pm
            WHERE pm.id.userId = :userId
             AND pm.project.deletedAt IS NULL
             ORDER BY pm.project.updatedAt DESC
            """)
     // and exist is used to only fetch those project only of which user that logged in is a oart of i dont want any user to be able to access all projects even if he is not a member of that project
    List<ProjectWithRole> findAllAccessibleByUser (@Param("userId") Long userID);

    @Query("""
            Select p from Project p
            where p.id= :projectId
            and p.deletedAt is null
            AND EXISTS(
            SELECT 1 FROM ProjectMember pm
            WHERE pm.id.userId=:userId
            AND pm.id.projectId=:projectId
            )
            
            """)
    Optional<Project> findAccessibleProjectById(@Param("projectId") Long projectId, // without params you have to use ?1 and ?2 in above query which will be confusing
                                                @Param("userId") Long userId);

    @Query("""
            SELECT pm.project as project, pm.projectRole as role
            FROM ProjectMember pm
            WHERE pm.project.id = :projectId
             AND pm.id.userId = :userId
             AND pm.project.deletedAt IS NULL
            """)
    Optional<ProjectWithRole> findAccessibleProjectByIdWithRole(@Param("projectId") Long projectId, // without params you have to use ?1 and ?2 in above query which will be confusing
                                                @Param("userId") Long userId);

    interface ProjectWithRole{
        Project getProject();
        ProjectRole getRole();
}
}
