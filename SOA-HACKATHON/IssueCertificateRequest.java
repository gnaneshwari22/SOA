package com.soa.team17.certificate.dto;

import com.soa.team17.certificate.model.EnergySource;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class IssueCertificateRequest {

    @NotBlank
    private String serialNumber;

    @NotNull
    private EnergySource energySource;

    @NotNull
    @Min(value = 1, message = "Energy quantity must be greater than zero MWh")
    private Double energyQuantityMWh;

    @NotBlank
    private String currentOwnerOrganization;

    private String facilityName;
    private String gridRegion;
    private LocalDate issueDate;

    public IssueCertificateRequest() {}

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public EnergySource getEnergySource() { return energySource; }
    public void setEnergySource(EnergySource energySource) { this.energySource = energySource; }

    public Double getEnergyQuantityMWh() { return energyQuantityMWh; }
    public void setEnergyQuantityMWh(Double energyQuantityMWh) { this.energyQuantityMWh = energyQuantityMWh; }

    public String getCurrentOwnerOrganization() { return currentOwnerOrganization; }
    public void setCurrentOwnerOrganization(String currentOwnerOrganization) { this.currentOwnerOrganization = currentOwnerOrganization; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getGridRegion() { return gridRegion; }
    public void setGridRegion(String gridRegion) { this.gridRegion = gridRegion; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
}
