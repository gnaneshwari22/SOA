package com.soa.team17.retirement.dto;

import jakarta.validation.constraints.NotBlank;

public class RetireCertificateRequest {

    @NotBlank
    private String serialNumber;

    @NotBlank
    private String claimReference;

    @NotBlank
    private String claimantOrganization;

    private String purpose;
    private Double energyQuantityMWh = 500.0;
    private String energySource = "Solar";

    public RetireCertificateRequest() {}

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getClaimReference() { return claimReference; }
    public void setClaimReference(String claimReference) { this.claimReference = claimReference; }

    public String getClaimantOrganization() { return claimantOrganization; }
    public void setClaimantOrganization(String claimantOrganization) { this.claimantOrganization = claimantOrganization; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public Double getEnergyQuantityMWh() { return energyQuantityMWh; }
    public void setEnergyQuantityMWh(Double energyQuantityMWh) { this.energyQuantityMWh = energyQuantityMWh; }

    public String getEnergySource() { return energySource; }
    public void setEnergySource(String energySource) { this.energySource = energySource; }
}
