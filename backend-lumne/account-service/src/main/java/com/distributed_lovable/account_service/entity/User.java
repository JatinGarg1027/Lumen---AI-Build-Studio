package com.distributed_lovable.account_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@FieldDefaults(level = AccessLevel.PRIVATE) // no need to set all field private separately (lombok)
@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "users")
public class User  {  // you cant use the table name as user as user is a predefined word in db/application so use @table annotation to rename it

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String username;
    String password;
    String name;

    @Column(unique = true)
    String stripeCustomerId; // so that one customer has just one stripe id

    @CreationTimestamp
    Instant createdAt;

    @UpdateTimestamp
    Instant updatedAt;

    Instant deletedAt; // these are soft deletes like archives users data is not actually deleted but made inactive company stores this data for compliance reason maybe after 1 year they can delete the data depends on the policy of company


    // Instant is same as LocalDateTime with some extra functionality
    // ctrl+alt+shift+J (cursor on all same words) // alt+shift+click for multi caret
}
