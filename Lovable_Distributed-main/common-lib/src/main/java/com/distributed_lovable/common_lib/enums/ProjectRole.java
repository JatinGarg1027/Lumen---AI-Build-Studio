package com.distributed_lovable.common_lib.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Set;

import static com.distributed_lovable.common_lib.enums.ProjectPermission.*;


@Getter
@RequiredArgsConstructor
public enum ProjectRole {

    EDITOR(EDIT,VIEW,DELETE,VIEW_MEMBERS), //  this came from ProjectPermission this is also like a argument constructor for ProjectRole
    VIEWER(VIEW,VIEW_MEMBERS),
    OWNER(EDIT,VIEW,DELETE,MANAGE_MEMBERS,VIEW_MEMBERS);

    ProjectRole(ProjectPermission... permission) { // this sets the value od Editor to EDIT,VIEW,DELETE and so on
        this.permission = Set.of(permission);
    }

    private final Set<ProjectPermission> permission; // for every above enum this is how there values will be first write this then mention values of enum else that wont work
}
