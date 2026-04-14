package com.web.dto.user;
import lombok.Data;
@Data
public class UpdateProfileRequest {
    private String name;
    private String phoneNumber;
    private String address;
    private String city;
    private String state;
}
