package com.soa.team17.ownership.dto;

import jakarta.validation.constraints.NotBlank;

public class TransferRequest {

    @NotBlank
    private String serialNumber;

    @NotBlank
    private String newOwnerOrganization;

    private String notes;

    public TransferRequest() {}

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getNewOwnerOrganization() { return newOwnerOrganization; }
    public void setNewOwnerOrganization(String newOwnerOrganization) { this.newOwnerOrganization = newOwnerOrganization; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
