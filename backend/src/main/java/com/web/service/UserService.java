package com.web.service;
import com.cloudinary.Cloudinary;
import com.web.dto.user.ChangePasswordRequest;
import com.web.dto.user.UpdateProfileRequest;
import com.web.dto.user.UserResponse;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.utils.ObjectUtils; 
import java.io.IOException; 
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import com.web.entity.User;
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
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
    @Autowired
    private Cloudinary cloudinary;

    public String uploadAvatar(MultipartFile file, String email) throws IOException {
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
                String imageUrl = uploadResult.get("url").toString();
                User user = userRepository.findByEmail(email).orElseThrow();
        user.setAvatarUrl(imageUrl);
        userRepository.save(user);
        
        return imageUrl;
    }
    public UserResponse getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
                UserResponse response = new UserResponse();
        response.setName(user.getName());
        response.setEmail(user.getEmail());
        response.setAvatarUrl(user.getAvatarUrl()); 
        response.setPhoneNumber(user.getPhoneNumber());       
        response.setAddress(user.getAddress());
        response.setCity(user.getCity());
        response.setState(user.getState());
        return response;
    }
    @Transactional
    public User updateProfile(String email, UpdateProfileRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email: " + email));

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            user.setName(req.getName().trim());
        }
        if (req.getPhoneNumber() != null) {
            user.setPhoneNumber(req.getPhoneNumber().trim());
        }
        if (req.getAddress() != null) {
            user.setAddress(req.getAddress().trim());
        }
        if (req.getCity() != null) {
            user.setCity(req.getCity().trim());
        }
        if (req.getState() != null) {
            user.setState(req.getState().trim());
        }
        return userRepository.save(user);
    }
    @Transactional
    public void changePassword(String email, ChangePasswordRequest req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không chính xác!");
        }
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }
}