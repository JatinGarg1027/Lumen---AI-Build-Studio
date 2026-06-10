package com.distributed_lovable.workspace_service.entity;


import com.distributed_lovable.common_lib.enums.ProjectRole;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "project_members")
public class ProjectMember {

    @EmbeddedId // embedded id since id type is not long but projectMemberid which is a combination of project and user id , so this embedded id join both these id to create a primary field
    ProjectMemberId id; // in enums this id has both user id and project id // also open this projectMemberId  enum and put @embeddable here as well as getter setter noargs and allargs constructor

    @ManyToOne // means one project to many users(not projectMembers as project member is not a independent class but a combination of project and user so since project is assigned at one so user will be assigned at many so one project to many users similarly below @Many to one says one user to many project, so eventuallly it many users to many projects but writen in a different way as writting mant to many annotation will result in creation of other column which will cause confusing and is not needed , so instead map both these field with their name to help as a fk in storing the insatnces
    @MapsId("projectId") // because i want project variable to point to projectId present in projectMEmberid(that has two id userId and projectId)
    Project project;
    // without this mapsId("projectId") yher would be another projectid column ie one from embeddedId and one from project variable which i dojnt want as it will lead to ambiguity so i maped that embedded id userid,project id to these project and user variable so now we just have 1 of the each column only

    @Enumerated(EnumType.STRING)
   // @Column(nullable = false)
    ProjectRole projectRole;  // in enums we can access the ProjectRole

    Instant invitedAt;
    Instant acceptedAt;
}
