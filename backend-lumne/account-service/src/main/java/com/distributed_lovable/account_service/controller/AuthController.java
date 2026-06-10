package com.distributed_lovable.account_service.controller;

import com.distributed_lovable.account_service.dto.auth.AuthResponse;
import com.distributed_lovable.account_service.dto.auth.LoginRequest;
import com.distributed_lovable.account_service.dto.auth.SignupRequest;
import com.distributed_lovable.account_service.service.AuthService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor // generate objects using constructor now you dont need to write them
@RequestMapping("/auth")
@FieldDefaults(makeFinal = true ,level = AccessLevel.PRIVATE)
public class AuthController {

     AuthService authServiceObj; // from service folder
    // UserService userServiceObj;
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request)
    {
        return ResponseEntity.ok(authServiceObj.signup(request));
    }


    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request)
    {
        return  ResponseEntity.ok(authServiceObj.login(request));
    }

//    @GetMapping("/me")
//    public ResponseEntity<UserProfileResponse> getProfile(){
//        Long userId=1L;
//        return ResponseEntity.ok(userServiceObj.getProfile(userId));
//    }

}
