package com.web.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class CreateProjectRequest {

    @NotBlank(message = "Tên project không được để trống")
    @Size(max = 255, message = "Tên tối đa 255 ký tự")
    private String name;

    @NotBlank(message = "Key không được để trống")
    @Size(min = 2, max = 20, message = "Key dài 2-20 ký tự")
    private String key;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
