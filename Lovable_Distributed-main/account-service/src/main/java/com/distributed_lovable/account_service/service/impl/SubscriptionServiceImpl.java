package com.distributed_lovable.account_service.service.impl;

import com.distributed_lovable.account_service.dto.subscription.SubscriptionResponse;
import com.distributed_lovable.account_service.entity.Plan;
import com.distributed_lovable.account_service.entity.Subscription;
import com.distributed_lovable.account_service.entity.User;
import com.distributed_lovable.account_service.mapper.SubscriptionMapper;
import com.distributed_lovable.account_service.repository.PlanRepository;
import com.distributed_lovable.account_service.repository.SubscriptionRepository;
import com.distributed_lovable.account_service.repository.UserRepository;
import com.distributed_lovable.account_service.service.SubscriptionService;
import com.distributed_lovable.common_lib.dto.PlanDto;
import com.distributed_lovable.common_lib.enums.SubscriptionStatus;
import com.distributed_lovable.common_lib.errors.ResourceNotFoundException;
import com.distributed_lovable.common_lib.security.AuthUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubscriptionServiceImpl implements SubscriptionService {

    private final AuthUtil authUtil;
    private final SubscriptionRepository subscriptionRepositoryObj;
    private final SubscriptionMapper subscriptionMapper;
    private final UserRepository userRepositoryObj;
    private final PlanRepository planRepositoryObj;

    private final Integer FREE_TIER_PROJECTS_ALLOWED=100;

    @Override
    public SubscriptionResponse getCurrentSubscription() {

        Long userId=authUtil.getCurrentUserId();

        var currentSubscription=subscriptionRepositoryObj.findByUserIdAndStatusIn(userId, Set.of(
                SubscriptionStatus.ACTIVE,SubscriptionStatus.PAST_DUE,SubscriptionStatus.TRIALING // as all 3 of these means plan is active
        )).orElse(
                new Subscription() // ie everything comes out to be null
        );

        return subscriptionMapper.toSubscriptionResponse(currentSubscription);
    }

    @Override
    public void activateSubscription(Long userId, Long planId, String subscriptionId, String customerId) {

        boolean exists= subscriptionRepositoryObj.existsByStripeSubscriptionId(subscriptionId);
        if(exists) return;

        User user=getUser(userId);
        Plan plan=getPlan(planId);

        Subscription subscription=Subscription.builder()
                .user(user)
                .plan(plan)
                .stripeSubscriptionId(subscriptionId)
                .status(SubscriptionStatus.INCOMPLETE) // incomplete here as it will be completed at the method renewSubscriptionPeriod
                .build();

        subscriptionRepositoryObj.save(subscription);

    }

    @Override
    @Transactional // so that ant changes made gets saved automatically
    public void updateSubscription(String gatewaySubscriptionId, SubscriptionStatus status, Instant periodStart,
                                   Instant periodEnd, Boolean cancelAtPeriodEnd, Long planId) {

        Subscription subscription=getSubscription(gatewaySubscriptionId);

        boolean hasSubscriptionUpdated=false;

        if(status!=null && status!=subscription.getStatus()) // ie if its not any of the previous value
        {
            subscription.setStatus(status);
            hasSubscriptionUpdated=true;
        }

        if(periodStart!=null && !periodStart.equals(subscription.getCurrentPeriodStart()))
        {
            subscription.setCurrentPeriodStart(periodStart);
            hasSubscriptionUpdated=true;
        }

        if(periodEnd!=null && !periodEnd.equals(subscription.getCurrentPeriodEnd()))
        {
            subscription.setCurrentPeriodEnd(periodEnd);
            hasSubscriptionUpdated=true;
        }

        if(cancelAtPeriodEnd!=null && cancelAtPeriodEnd!=subscription.getCancelAtPeriodEnd())
        {
            subscription.setCancelAtPeriodEnd(cancelAtPeriodEnd);
            hasSubscriptionUpdated=true;
        }

        if(planId!=null && !planId.equals(subscription.getPlan().getId()))
        {
            Plan newPlan=getPlan(planId);
            subscription.setPlan(newPlan);
            hasSubscriptionUpdated=true;
        }


        if(hasSubscriptionUpdated) // not needed as much as transactional will take care of it but still just a good practice
        {
            log.debug("Subscription has been updated: {}",gatewaySubscriptionId);
            subscriptionRepositoryObj.save(subscription);
        }
        /// transaction will make sure when subscription is dirtied then the changes remains

    }

    @Override
    public void cancelSubscription(String gatewaySubscriptionId) {

        Subscription subscription=getSubscription(gatewaySubscriptionId);
        subscription.setStatus(SubscriptionStatus.CANCELED);
        subscriptionRepositoryObj.save(subscription);
    }

    @Override
    public void renewSubscriptionPeriod(String gatewaySubscriptionId, Instant periodStart, Instant periodEnd) {

        Subscription subscription= getSubscription(gatewaySubscriptionId);

        Instant newStart=periodStart!=null?periodStart:subscription.getCurrentPeriodEnd(); // periodStart would never be null its just a check
        subscription.setCurrentPeriodStart(newStart);
        subscription.setCurrentPeriodEnd(periodEnd);

        if(subscription.getStatus()== SubscriptionStatus.PAST_DUE || subscription.getStatus()== SubscriptionStatus.INCOMPLETE )
        {
            subscription.setStatus(SubscriptionStatus.ACTIVE);
        }
        subscriptionRepositoryObj.save(subscription);

    }



    @Override
    public void markSubscriptionPastDue(String gatewaySubscriptionId) {

        Subscription subscription=getSubscription(gatewaySubscriptionId);

        if(subscription.getStatus()== SubscriptionStatus.PAST_DUE)
        {
            log.debug("Subscription is already past due, gatewaySubscriptionId: {}",gatewaySubscriptionId);
            return;
        }

        subscription.setStatus(SubscriptionStatus.PAST_DUE);
        subscriptionRepositoryObj.save(subscription);

        // then maybe u can notify this via email

    }

    @Override
    public PlanDto getCurrentSubscribedPlanByUser() {
        SubscriptionResponse subscriptionResponse=getCurrentSubscription();
        return subscriptionResponse.plan();
    }


    ///  UTILITY METHODS ///

    private User getUser(Long userId)
    {
        return userRepositoryObj.findById(userId)
                .orElseThrow(()->new ResourceNotFoundException("User",userId.toString()));
    }

    private Plan getPlan(Long planId)
    {
        return planRepositoryObj.findById(planId)
                .orElseThrow(()->new ResourceNotFoundException("Plan",planId.toString()));
    }

    private Subscription getSubscription(String gatewaySubscriptionId) {
        return subscriptionRepositoryObj.findByStripeSubscriptionId(gatewaySubscriptionId).orElseThrow(() ->
                new ResourceNotFoundException("Subscription", gatewaySubscriptionId));
    }

}
