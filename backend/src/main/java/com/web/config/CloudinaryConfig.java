package com.web.config;


import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {
    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", "damth4itm",
            "api_key", "317119829719873",
            "api_secret", "Vl5_mXLzJ3aW6CqpbysHunO7qkY"
        ));
    }
}