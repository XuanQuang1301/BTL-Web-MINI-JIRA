package com.web.dto.task;

import jakarta.validation.constraints.NotBlank;

public class UpdateTaskStatusRequest {

    @NotBlank(message = "Trang thai khong duoc de trong")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}