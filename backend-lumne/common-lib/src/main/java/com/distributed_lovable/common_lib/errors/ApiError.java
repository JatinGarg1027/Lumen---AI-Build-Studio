package com.distributed_lovable.common_lib.errors;

import com.fasterxml.jackson.annotation.*;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;

public record ApiError (
        HttpStatus status,
        String message,
        Instant timeStamp,
        // json include not null will only include the error if there is an error list to show so in cases where there are not multiple errors this field wont even show
        @JsonInclude(JsonInclude.Include.NON_NULL) List<ApiFieldError> errors// if there are multiple validation errors ex- email is not valid age os above limit and many more so we done want those message to have all errors in one message only but all on different lines
){
    public ApiError(HttpStatus status,String message)
    {
        this(status,message,Instant.now(),null);
    }
    public ApiError(HttpStatus status,String message,List<ApiFieldError> errors)
    {
        this(status,message,Instant.now(),errors);
    }
}

record ApiFieldError(String field,String message){};
