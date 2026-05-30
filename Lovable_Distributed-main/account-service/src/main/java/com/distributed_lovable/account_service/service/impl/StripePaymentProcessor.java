package com.distributed_lovable.account_service.service.impl;

import com.distributed_lovable.account_service.dto.subscription.CheckoutRequest;
import com.distributed_lovable.account_service.dto.subscription.CheckoutResponse;
import com.distributed_lovable.account_service.dto.subscription.PortalResponse;
import com.distributed_lovable.account_service.entity.Plan;
import com.distributed_lovable.account_service.entity.User;
import com.distributed_lovable.account_service.repository.PlanRepository;
import com.distributed_lovable.account_service.repository.UserRepository;
import com.distributed_lovable.account_service.service.PaymentProcessor;
import com.distributed_lovable.account_service.service.SubscriptionService;
import com.distributed_lovable.common_lib.enums.SubscriptionStatus;
import com.distributed_lovable.common_lib.errors.BadRequestException;
import com.distributed_lovable.common_lib.errors.ResourceNotFoundException;
import com.distributed_lovable.common_lib.security.AuthUtil;
import com.stripe.exception.StripeException;
import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StripePaymentProcessor implements PaymentProcessor {

    private final AuthUtil authUtil;
    private final PlanRepository planRepositoryObj;
    private final UserRepository userRepositoryObj;
    private final SubscriptionService subscriptionServiceObj;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Override
    public CheckoutResponse createCheckoutSessionUrl(CheckoutRequest request) {

        Plan plan = planRepositoryObj.findById(request.planId()).orElseThrow(() ->
                new ResourceNotFoundException("Plan", request.planId().toString()));

        Long userId = authUtil.getCurrentUserId();
        User user = getUser(userId);

        // ============================
        // CHANGED: using Builder explicitly (no functional change)
        // ============================
        SessionCreateParams.Builder paramsBuilder = SessionCreateParams.builder()
                .addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setPrice(plan.getStripePriceId())
                                .setQuantity(1L)
                                .build())
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSubscriptionData(
                        SessionCreateParams.SubscriptionData.builder()
                                .setBillingMode(
                                        SessionCreateParams.SubscriptionData.BillingMode.builder()
                                                .setType(SessionCreateParams.SubscriptionData.BillingMode.Type.FLEXIBLE)
                                                .build())
                                .build())
                .setSuccessUrl(frontendUrl + "/success.html?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(frontendUrl + "/cancel.html")
                .putMetadata("user_id", userId.toString())
                .putMetadata("plan_id", plan.getId().toString());

        try {
            String stripeCustomerId = user.getStripeCustomerId();

            if (stripeCustomerId == null || stripeCustomerId.isEmpty()) {
                paramsBuilder.setCustomerEmail(user.getUsername());
            } else {
                paramsBuilder.setCustomer(stripeCustomerId);
            }

            // ============================
            // 🔴 FIX: BUILD the params before calling Session.create()
            // ============================
            SessionCreateParams params = paramsBuilder.build(); // <-- THIS LINE FIXES THE ERROR

            Session session = Session.create(params);
            return new CheckoutResponse(session.getUrl());

        } catch (StripeException e) {
            throw new RuntimeException(e);
        }
    }



    @Override
    public PortalResponse createCustomerPortal() {

        Long userId= authUtil.getCurrentUserId();
        User user=getUser(userId);
        String stripeCustomerId=user.getStripeCustomerId(); // this will be filled when an user subscribe

        if(stripeCustomerId==null || stripeCustomerId.isEmpty())
        {
            throw  new BadRequestException("User does not have a stripe Customer Id,User Id:"+userId);
        }

        try {
            var portalSession= com.stripe.model.billingportal.Session.create(
                    com.stripe.param.billingportal.SessionCreateParams.builder()
                            .setCustomer(stripeCustomerId)
                            .setReturnUrl(frontendUrl)
                            .build()
            );
            return new PortalResponse(portalSession.getUrl());

        } catch (StripeException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void handleWebhookEvent(String type, StripeObject stripeObject, Map<String, String> metadata) {
        log.info("type: {}",type);  // stripe object will contain every object(Info) here , u can type cast this object with any info u want

        switch (type)
        {
            case "checkout.session.completed"->
                    handleCheckoutSessionCompleted((Session) stripeObject,metadata); // one time on checkout completed


            case "customer.subscription.updated"->
                    handleCustomerSubscriptionUpdated((Subscription)  stripeObject); // when user cancels,upgrade or any updates


            case "customer.subscription.deleted" ->
                    handleCustomerSubscriptionDeleted((Subscription) stripeObject); // when subscription ends // remove the access


            case "invoice.paid"->
                    handleInvoicePaid((Invoice) stripeObject); // source of truth , when invoice is paid


            case "invoice.payment_failed"->
                    handleInvoicePaymentFailed((Invoice) stripeObject); // when invoice is not paid , mark as past_due // not revoking the access here


            default-> log.debug("Ignoring the event: {}",type); // there are many other event but for now ignore them
        }
    }

    private void handleCheckoutSessionCompleted(Session session , Map<String, String> metadata){

        if(session==null)
        {
            log.error("session object was null");
            return;
        }

        Long userId=Long.parseLong(metadata.get("user_id"));
        Long planId=Long.parseLong(metadata.get("plan_id"));

        String subscriptionId=session.getSubscription(); // this will get subscription id from the stripe
        String customerId=session.getCustomer(); // this will get customerId which we will set to customerStripeId

        User user=getUser(userId);
        if(user.getStripeCustomerId()==null)
        {
            user.setStripeCustomerId(customerId);
            userRepositoryObj.save(user);
        }

        subscriptionServiceObj.activateSubscription(userId,planId,subscriptionId,customerId);

    }

    private void handleCustomerSubscriptionUpdated(Subscription subscription){

        if(subscription==null)
        {
            log.error("subscription object was null inside handleCustomerSubscriptionUpdated");
            return;
        }
        SubscriptionStatus status=mapStripeStatusToEnum(subscription.getStatus());
        if(status==null)
        {
            log.warn("Unknown status '{}' for subscription {}",subscription.getStatus(),subscription.getId());
            return;
        }

        SubscriptionItem item= subscription.getItems().getData().get(0);
        Instant periodStart= toInstant(item.getCurrentPeriodStart()); // to instant covert this long value to instant
        Instant periodEnd= toInstant(item.getCurrentPeriodEnd());

        Long planId=resolvePlanId(item.getPrice()); // will get the plan price ex-499 or 1499 for pro or business

        subscriptionServiceObj.updateSubscription(subscription.getId(),status,periodStart,periodEnd,
                                                    subscription.getCancelAtPeriodEnd(),planId);
    }


    private void handleCustomerSubscriptionDeleted(Subscription subscription){

        if(subscription==null)
        {
            log.error("subscription object was null inside handleCustomerSubscriptionDeleted");
            return;
        }
        subscriptionServiceObj.cancelSubscription(subscription.getId());
    }

    private void handleInvoicePaid(Invoice invoice){ // we can extract subscription details from invoice as well

        String subId=extractSubscriptionId(invoice);
        if(subId == null) return;

        try {
            Subscription subscription= Subscription.retrieve(subId); // sdk calling the stripe server
            var item=subscription.getItems().getData().get(0);

            Instant periodStart=toInstant(item.getCurrentPeriodStart());
            Instant periodEnd=toInstant(item.getCurrentPeriodEnd());

            subscriptionServiceObj.renewSubscriptionPeriod(
                    subId,
                    periodStart,
                    periodEnd
            );

        }
        catch (StripeException e) {
            throw new RuntimeException(e);
        }
    }

    private void handleInvoicePaymentFailed(Invoice invoice){

        String subId=extractSubscriptionId(invoice);
        if(subId == null) return;

        subscriptionServiceObj.markSubscriptionPastDue(subId);


    }



                          /// //// Utility methods /// /////


    private User getUser(Long userId) {
        User user = userRepositoryObj.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("user", userId.toString()));
        return user;
    }

    private SubscriptionStatus mapStripeStatusToEnum(String status) {

            return switch (status) {
                case "active" -> SubscriptionStatus.ACTIVE;
                case "trialing" -> SubscriptionStatus.TRIALING;
                case "past_due","unpaid","paused","incomplete_expired" -> SubscriptionStatus.PAST_DUE;
                case "canceled" -> SubscriptionStatus.CANCELED;
                case "incomplete" -> SubscriptionStatus.INCOMPLETE;
                default ->
                        {
                          log.warn("Unmapped Stripe status{}",status);
                          yield null;
                        }
            };
        }


    private Instant toInstant(Long epoch) { // takes a long value and convert it to instant

        return  epoch != null ?Instant.ofEpochSecond(epoch):null;
    }

    private Long resolvePlanId(Price price) {
        if(price==null || price.getId()==null) return null;
        return planRepositoryObj.findByStripePriceId(price.getId())
                .map(Plan::getId)
                .orElse(null);
    }

    private String extractSubscriptionId(Invoice invoice)
    {
        var parent=invoice.getParent();
        if(parent==null) return null;

        var subDetails=parent.getSubscriptionDetails();
        if(subDetails==null)return null;

        return subDetails.getSubscription();
    }


}
