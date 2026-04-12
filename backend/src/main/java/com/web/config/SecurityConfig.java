package com.web.config;

import com.web.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private DaoAuthenticationProvider authenticationProvider;

    // Lấy origin từ application.properties
    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Cấu hình CORS
            .cors(cors -> cors.configurationSource(request -> {
                CorsConfiguration config = new CorsConfiguration();
                if (allowedOrigins != null && !allowedOrigins.isEmpty()) {
                    config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
                }
                config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(Arrays.asList("*"));
                config.setAllowCredentials(true);
                return config;
            }))

            // 2. Tắt CSRF (Bắt buộc khi dùng JWT)
            .csrf(csrf -> csrf.disable())

            // 3. Tắt quản lý Session (Stateless - Bắt buộc khi dùng JWT)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 4. Quy tắc phân quyền URL
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/auth/**", "/error").permitAll() // Mở cửa cho API đăng nhập/đăng ký
                    .anyRequest().authenticated() // Mọi API khác đều phải có token
            )

            // 5. Kéo AuthenticationProvider từ AuthConfig vào
            .authenticationProvider(authenticationProvider)

            // 6. Chèn JWT Filter vào trước Filter mặc định của Spring
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}