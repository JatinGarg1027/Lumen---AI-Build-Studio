package com.distributed_lovable.api_gateway.service;


import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Service
public class JwtGatewayService {

    private static final Logger log = LoggerFactory.getLogger(JwtGatewayService.class);

    @Value("${jwt.secret-key:${jwt.secret:${JWT_SECRET:4a626132356c356d346e356f3670377138723973307431753276337734783579}}}")
    private String secretKey;

    @PostConstruct
    public void debugKey() {
        log.warn("DEBUG JwtGatewayService jwt key length={}, first10chars='{}'", secretKey.length(), secretKey.substring(0, Math.min(10, secretKey.length())));
    }

    public void validateToken(String token) {
        log.warn("DEBUG validateToken called with key length={}, full key hash={}, first token chars='{}'",
                secretKey.length(), secretKey.hashCode(), token.substring(0, Math.min(20, token.length())));
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));

        Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token);
    }
}
