package com.web.controller;

import com.web.entity.User;
import com.web.repository.UserRepository;
import com.web.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    // ===================== SIGN UP =====================
    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody User signUpRequest) {

        // Kiểm tra email tồn tại
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Email đã tồn tại!");
        }

        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequest.getPassword())); // Encode password
        user.setAvatarUrl(signUpRequest.getAvatarUrl());

        userRepository.save(user);

        return ResponseEntity.ok("Đăng ký thành công!");
    }

    // ===================== SIGN IN =====================
    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody User loginRequest) {
        try {
            // Xác thực thông qua AuthenticationManager (dùng UserDetailsService + BCrypt)
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()));

            // Tạo JWT từ thông tin đã xác thực
            String token = jwtUtils.generateToken(authentication);

            // Lấy thông tin user để trả về (ẩn password)
            User user = userRepository.findByEmail(loginRequest.getEmail()).orElse(null);

            Map<String, Object> profile = new HashMap<>();
            if (user != null) {
                profile.put("id", user.getId());
                profile.put("name", user.getName());
                profile.put("email", user.getEmail());
                profile.put("avatarUrl", user.getAvatarUrl());
            }

            Map<String, Object> body = new HashMap<>();
            body.put("token", token);
            body.put("type", "Bearer");
            body.put("user", profile);

            return ResponseEntity.ok(body);
        } catch (Exception ex) {
            return ResponseEntity.status(401).body("Đăng nhập thất bại! Email hoặc mật khẩu không đúng.");
        }
    }
}
