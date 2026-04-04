package com.web.dto.member;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AddMemberRequest {
    @NotBlank(message = "Email khong được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    private String role; // optional, default MEMBER

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
