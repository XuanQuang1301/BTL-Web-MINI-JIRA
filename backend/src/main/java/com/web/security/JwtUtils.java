package com.web.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * JwtUtils — "Xưởng làm thẻ ra vào"
 *
 * Class này làm 3 việc:
 * 1. generateToken() → Tạo thẻ mới khi user đăng nhập thành công
 * 2. getUsernameFrom() → Đọc tên user từ thẻ
 * 3. validateToken() → Kiểm tra thẻ có hợp lệ và còn hạn không
 */
@Component
public class JwtUtils {

    // Lấy từ application.properties (bí mật, không hardcode)
    @Value("${app.jwt.secret:TinyJiraSecretKeyMustBe256BitsLongForHS256Algorithm!}")
    private String jwtSecret;

    // Token hết hạn sau 24 giờ (đơn vị: milliseconds)
    @Value("${app.jwt.expiration:86400000}")
    private int jwtExpirationMs;

    /**
     * Tạo JWT Token từ thông tin user vừa đăng nhập thành công
     */
    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();

        return Jwts.builder()
                .setSubject(userPrincipal.getUsername()) // Ghi tên user vào token
                .setIssuedAt(new Date()) // Thời điểm tạo
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs)) // Hết hạn
                .signWith(getSigningKey(), SignatureAlgorithm.HS256) // Ký bằng key bí mật
                .compact();
    }

    /**
     * Đọc username từ token (dùng khi xác thực mỗi request)
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Kiểm tra token có hợp lệ không
     * Trả về true → Token OK, cho qua
     * Trả về false → Token lỗi/hết hạn, chặn lại
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (SecurityException e) {
            System.err.println("JWT signature không hợp lệ: " + e.getMessage());
        } catch (MalformedJwtException e) {
            System.err.println("JWT token bị lỗi định dạng: " + e.getMessage());
        } catch (ExpiredJwtException e) {
            System.err.println("JWT token đã hết hạn: " + e.getMessage());
        } catch (UnsupportedJwtException e) {
            System.err.println("JWT token không được hỗ trợ: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            System.err.println("JWT claims rỗng: " + e.getMessage());
        }
        return false;
    }

    // Chuyển đổi secret string thành Key object để ký token
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
}