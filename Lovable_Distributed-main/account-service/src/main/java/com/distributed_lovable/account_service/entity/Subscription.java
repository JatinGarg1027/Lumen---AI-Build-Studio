package com.distributed_lovable.account_service.entity;

import com.distributed_lovable.common_lib.enums.SubscriptionStatus;
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
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;    // id ,use_id ,plan it should be of type bigint but we kept it long,user and plan as hibernate will convert it for us so we dont have to.

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "user_id")
    User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(nullable = false,name = "plan_id")
    Plan plan;

    @Enumerated(value = EnumType.STRING)
    SubscriptionStatus status; // SubscriptionStatus is a custom datatype that can have 5 values defined in SubscriptionStatus class


    String stripeSubscriptionId;

    Instant currentPeriodStart;
    Instant currentPeriodEnd;
    Boolean cancelAtPeriodEnd= false;  // by default we dont want to end subscription on month end only end if he dont renews

    @CreationTimestamp
    Instant createdAt;

    @UpdateTimestamp
    Instant updatedAt;


}
