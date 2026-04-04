package com.web.security;

import com.web.entity.User;
import com.web.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

/**
 * UserDetailsServiceImpl — "Nhân viên tra cứu hồ sơ"
 *
 * Spring Security cần class này để tìm user trong database.
 * Khi ai đó đăng nhập, Spring gọi loadUserByUsername() để:
 * 1. Tìm user trong DB theo username
 * 2. Trả về UserDetails (Spring dùng để so sánh password, phân quyền...)
 */

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

        @Autowired
        private UserRepository userRepository;

        @Override
        public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

                // Tìm theo email thay vì username
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "Không tìm thấy user với email: " + email));

                return new org.springframework.security.core.userdetails.User(
                                user.getEmail(), // dùng email làm principal
                                user.getPassword(),
                                new ArrayList<>());
        }
}