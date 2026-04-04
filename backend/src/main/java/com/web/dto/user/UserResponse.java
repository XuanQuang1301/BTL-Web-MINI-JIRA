package com.web.dto.user;
import java.time.LocalDateTime;
import lombok.Data;
@Data
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String avatarUrl;
    private LocalDateTime createAt; 
}