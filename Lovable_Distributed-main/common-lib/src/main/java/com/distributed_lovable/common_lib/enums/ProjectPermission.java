package com.distributed_lovable.common_lib.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum ProjectPermission {

    VIEW("project:view"),   // these are like parametrized constructor of projectPermission class equivalent to VIEW = new ProjectPermission("project:view");
    EDIT("project:edit"),
    DELETE("project:delete"),
    MANAGE_MEMBERS("project_members:manage"),
    VIEW_MEMBERS("project_members:view");

    private final String value; // Each enum constant stores its own value.
}
