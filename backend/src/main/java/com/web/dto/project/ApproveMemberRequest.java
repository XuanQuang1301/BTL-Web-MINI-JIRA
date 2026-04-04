package com.web.dto.project;

import jakarta.validation.constraints.NotNull;

public class ApproveMemberRequest {
    @NotNull(message = "ID bản ghi thành viên không được để trống")
    private Integer memberRecordId;

    public Integer getMemberRecordId() {
        return memberRecordId;
    }

    public void setMemberRecordId(Integer memberRecordId) {
        this.memberRecordId = memberRecordId;
    }
}