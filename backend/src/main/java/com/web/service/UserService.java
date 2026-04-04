package com.web.service;
import com.web.dto.user.UserResponse;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(user -> {
            UserResponse res = new UserResponse();
            res.setId(user.getId());
            res.setName(user.getName());
            res.setEmail(user.getEmail());
            res.setAvatarUrl(user.getAvatarUrl());
            res.setCreateAt(user.getCreatedAt());; 
            return res;
        }).collect(Collectors.toList());
    }
}