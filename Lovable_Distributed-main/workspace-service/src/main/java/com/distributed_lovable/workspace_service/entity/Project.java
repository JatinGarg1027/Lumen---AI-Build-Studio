package com.distributed_lovable.workspace_service.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@FieldDefaults(level = AccessLevel.PRIVATE)
@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "projects",
indexes = {
        // we make indexes for the columns which are trying to be fetched in the plsql queries in repository it brings processing time from O(n) to O(logn)
        @Index(name = "idx_projects_updatedAt_desc",columnList = "updated_at DESC,deleted_at"), // order is important if we are searching on basic of delete_at the below field will be used in this fields first updated_At is created then delete at these index sequence are very important
        @Index(name = "idx_projects_deleted_at_updatedAt_desc",columnList = "deleted_at,updated_at DESC"), // order is important if we are searching on basic of delete_at the below field will be used in this fields first updated_At is created then delete at these index sequence are very important tahts why we create both first  where updated at is first and later is deleted_At and other is vice versa
        @Index(name = "idx_projects_deleted_at",columnList = "deleted_at") // if yu ahve created index with sequence a->b->c->d then u don't need to create inde for a,a->b,a->b->c seperately as the first one will deal with it
})
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String name;


    Boolean isPublic=false;

    @CreationTimestamp
    Instant createdAt;          // Instant is same as LocalDateTime with some extra functionality

    @UpdateTimestamp
    Instant updatedAt;

    Instant deletedAt;
}
