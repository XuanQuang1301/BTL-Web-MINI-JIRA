package com.web.dto.project;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateProjectRequest {

    @Size(max = 255, message = "Tên tối đa 255 ký tự")
    @Pattern(regexp = ".*\\S.*", message = "Tên project không được để trống")
    private String name;

    @Size(min = 2, max = 20, message = "Key dài 2-20 ký tự")
    @Pattern(regexp = ".*\\S.*", message = "Key không được để trống")
    private String key;

    @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
    private String description;

    @Pattern(regexp = "(?i)PLANNING|IN_PROGRESS|COMPLETED|ON_HOLD|ARCHIVED", message = "Status không hợp lệ")
    private String status;

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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
