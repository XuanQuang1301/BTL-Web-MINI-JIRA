package com.web.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JwtAuthenticationFilter — "Bảo vệ kiểm tra thẻ mỗi lượt vào cửa"
 *
 * Flow hoạt động (chạy mỗi khi có HTTP request đến):
 *
 * Request đến
 * │
 * ▼
 * Đọc header "Authorization: Bearer <token>"
 * │
 * ▼
 * Có token? ──No──► Bỏ qua, Spring Security sẽ chặn nếu API cần auth
 * │Yes
 * ▼
 * Token hợp lệ? ──No──► Bỏ qua (Spring Security sẽ trả 401)
 * │Yes
 * ▼
 * Lấy username → Load UserDetails → Đặt vào SecurityContext
 * │
 * ▼
 * Cho request đi tiếp vào Controller
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        try {
            // Bước 1: Lấy token từ header
            String jwt = parseJwt(request);

            // Bước 2: Kiểm tra token hợp lệ
            if (jwt != null && jwtUtils.validateToken(jwt)) {

                // Bước 3: Lấy username từ token
                String username = jwtUtils.getUsernameFromToken(jwt);

                // Bước 4: Load thông tin user từ database
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Bước 5: Tạo đối tượng xác thực và đặt vào SecurityContext
                // → Từ đây, Spring Security biết "request này của ai"
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities());
                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            System.err.println("Không thể xác thực user: " + e.getMessage());
        }

        // Bước 6: Cho request đi tiếp (dù có token hay không)
        filterChain.doFilter(request, response);
    }

    /**
     * Đọc JWT từ header Authorization
     * Header dạng: "Authorization: Bearer eyJhbGci..."
     * Ta cần cắt bỏ chữ "Bearer " ở đầu để lấy token thuần
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7); // Cắt "Bearer " (7 ký tự)
        }
        return null;
    }
}