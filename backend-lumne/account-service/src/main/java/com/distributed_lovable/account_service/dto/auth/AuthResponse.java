package com.distributed_lovable.account_service.dto.auth;

// record means all field become immutable so no setter method just getter and constructor
public record AuthResponse(
        String token,
        UserProfileResponse userProfileResponse
) {

}
