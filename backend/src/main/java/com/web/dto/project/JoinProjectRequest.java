package com.web.dto.project;
import jakarta.validation.constraints.NotBlank;

public class JoinProjectRequest {
    @NotBlank(message = "Mã dự án không được để trống")
    private String projectCode;

    public String getProjectCode() {
        return projectCode;
    }

    public void setProjectCode(String projectCode) {
        this.projectCode = projectCode;
    }
}
