package com.distributed_lovable.account_service.controller;

import com.distributed_lovable.account_service.dto.subscription.CheckoutRequest;
import com.distributed_lovable.account_service.dto.subscription.CheckoutResponse;
import com.distributed_lovable.account_service.dto.subscription.PortalResponse;
import com.distributed_lovable.account_service.dto.subscription.SubscriptionResponse;
import com.distributed_lovable.account_service.service.PaymentProcessor;
import com.distributed_lovable.account_service.service.SubscriptionService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor // generate objects using constructor now you dont need to write them

public class BillingController {

    private  final SubscriptionService subscriptionServiceObj;
    private final PaymentProcessor paymentProcessorObj;

    @Value("${stripe.webhook.secret}")
    private String webhookSecret;


    @GetMapping("/api/me/subscription")
    public ResponseEntity<SubscriptionResponse> getMySubscription(){

        return ResponseEntity.ok(subscriptionServiceObj.getCurrentSubscription());
    }

    @PostMapping("/api/payment/checkout")
    public ResponseEntity<CheckoutResponse> createCheckoutResponse(
            @RequestBody CheckoutRequest request
    ){

        return ResponseEntity.ok(paymentProcessorObj.createCheckoutSessionUrl(request));

    }

    @PostMapping("/api/payment/portal")
    public ResponseEntity<PortalResponse> openCustomerPortal(){

        return ResponseEntity.ok(paymentProcessorObj.createCustomerPortal());
    }

    @PostMapping("/webhooks/payment")
    public ResponseEntity<String>  handlePaymentWebhooks(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader)
    {
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, webhookSecret);

            EventDataObjectDeserializer deserializer=event.getDataObjectDeserializer();
            StripeObject stripeObject=null;

            if (deserializer.getObject().isPresent())
            {
                stripeObject=deserializer.getObject().get();
            }else
            {
                try {
                    stripeObject = deserializer.deserializeUnsafe();
                    if (stripeObject == null) {
                        log.warn("Failed to deserialize webhook object for event: {}", event.getType());
                        return ResponseEntity.ok().build();
                    }
                } catch (Exception e){
                    log.error("Unsafe description failed for event {}: {}",event.getType(),e.getMessage());
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Deserialization failed");
                }
            }

            //now extracting metadata only if its a checkout session
            Map<String,String> metadata=new HashMap<>();
            if (stripeObject instanceof Session session)
            {
                metadata=session.getMetadata();
            }

            //Pass to your processor
            paymentProcessorObj.handleWebhookEvent(event.getType(),stripeObject,metadata);

            return ResponseEntity.ok().build();
        }
        catch (SignatureVerificationException e)
        {
            throw new RuntimeException(e);
        }
    }

}
