package com.distributed_lovable.account_service.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PaymentConfig { // this class is used to attach the stripe dashboard to our code **very imp**

    @Value("${stripe.api.secret}")
    private String stripeSecretKey;

    @PostConstruct
    public void init(){
        Stripe.apiKey=stripeSecretKey;
    }


}
