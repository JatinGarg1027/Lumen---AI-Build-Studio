package com.distributed_lovable.common_lib.security;


import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Date;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class AuthUtil {

    private static final Logger log = LoggerFactory.getLogger(AuthUtil.class);

    @Value("${jwt.secret-key:${jwt.secret:${JWT_SECRET:4a626132356c356d346e356f3670377138723973307431753276337734783579}}}") // the @Value should be the spring one not lombok one
    private String jwtSecretKey;

    @PostConstruct
    public void debugKey() {
        log.warn("DEBUG AuthUtil jwt key length={}, first10chars='{}'", jwtSecretKey.length(), jwtSecretKey.substring(0, Math.min(10, jwtSecretKey.length())));
    }

    private SecretKey getSecretKey()
    {
        return Keys.hmacShaKeyFor(jwtSecretKey.getBytes(StandardCharsets.UTF_8));
    }
    public String generateAccessToken(JwtUserPrincipal user)
    {
        return Jwts.builder()
                .subject(user.username())
                .claim("userId",user.userId().toString())
                .claim("name",user.name())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+1000*60*100))
                .signWith(getSecretKey())
                .compact();
    }
    public JwtUserPrincipal verifyAccessToken(String token)
    {
        Claims claims=Jwts.parser()
                .verifyWith(getSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload(); // if token is wrong we wont move down

        Long userId=Long.parseLong(claims.get("userId", String.class));
        String name=claims.get("name",String.class);
        String username=claims.getSubject();
        return  new JwtUserPrincipal(userId,name,username,null,new ArrayList<>());
    }

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null ||
                !(authentication.getPrincipal() instanceof JwtUserPrincipal)) {
            throw new AuthenticationCredentialsNotFoundException("No JWT Found");
        }

        JwtUserPrincipal userPrincipal =
                (JwtUserPrincipal) authentication.getPrincipal();

        return userPrincipal.userId();
    }

}
