package com.web.config;

import com.web.security.JwtAuthenticationFilter;
import com.web.security.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * SecurityConfig — "Sơ đồ an ninh toàn tòa nhà"
 *
 * Định nghĩa:
 * - Cửa nào mở (không cần token): /api/auth/**
 * - Cửa nào khóa (cần token): tất cả còn lại
 * - Bảo vệ nào đứng gác: JwtAuthenticationFilter
 * - Công cụ mã hóa: BCryptPasswordEncoder
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    /**
     * BCrypt: thuật toán mã hóa password 1 chiều.
     * "123456" → "$2a$10$xyz..." (không thể giải mã ngược)
     * Mỗi lần encode ra chuỗi khác nhau nhưng vẫn so khớp được.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Kết nối UserDetailsService + PasswordEncoder để Spring
     * biết cách tìm user và so sánh password khi đăng nhập.
     */
    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    /**
     * AuthenticationManager: "Trưởng bộ phận xác thực"
     * AuthController cần inject bean này để gọi authenticate().
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * Bộ quy tắc bảo mật chính — đọc comment từng dòng để hiểu rõ.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 1. Tắt CSRF — an toàn vì dùng JWT (không dùng cookie/session)
                .csrf(csrf -> csrf.disable())

                // 2. Không lưu session — mỗi request tự mang token theo
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 3. Quy tắc phân quyền URL
                .authorizeHttpRequests(auth -> auth
                        // /api/auth/signin và /api/auth/signup → mở hoàn toàn
                        .requestMatchers("/api/auth/**", "/error").permitAll()
                        // Mọi URL khác → phải có JWT token hợp lệ
                        .anyRequest().authenticated())

                // 4. Đăng ký Authentication Provider
                .authenticationProvider(authenticationProvider())

                // 5. Đặt JwtFilter TRƯỚC UsernamePasswordAuthenticationFilter
                // → Mỗi request đến, filter này chạy trước, đọc token
                // → Nếu token hợp lệ, set vào SecurityContext
                // → Spring Security thấy đã xác thực → cho qua
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}