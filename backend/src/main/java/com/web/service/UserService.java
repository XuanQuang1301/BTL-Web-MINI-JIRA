package com.web.service;
import com.cloudinary.Cloudinary;
import com.web.dto.user.UserResponse;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
        return response;
    }
}