package com.soa.team17.certificate.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "certificates", indexes = {
        @Index(name = "idx_cert_serial", columnList = "serialNumber", unique = true),
        @Index(name = "idx_cert_owner", columnList = "currentOwnerOrganization"),
        @Index(name = "idx_cert_status", columnList = "status")
})
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true, updatable = false)
    private String serialNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EnergySource energySource;

    @Column(nullable = false)
    private Double energyQuantityMWh;

    @Column(nullable = false)
    private String issuingOrganization;

    @Column(nullable = false)
    private String currentOwnerOrganization;

    @Column(nullable = false)
    private LocalDate issueDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CertificateStatus status = CertificateStatus.ACTIVE;

    private String facilityName;
    private String gridRegion;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Certificate() {}

    public Certificate(String serialNumber, EnergySource energySource, Double energyQuantityMWh,
                       String issuingOrganization, String currentOwnerOrganization,
                       LocalDate issueDate, String facilityName, String gridRegion) {
        this.serialNumber = serialNumber;
        this.energySource = energySource;
        this.energyQuantityMWh = energyQuantityMWh;
        this.issuingOrganization = issuingOrganization;
        this.currentOwnerOrganization = currentOwnerOrganization;
        this.issueDate = issueDate;
        this.facilityName = facilityName;
        this.gridRegion = gridRegion;
        this.status = CertificateStatus.ACTIVE;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public EnergySource getEnergySource() { return energySource; }
    public void setEnergySource(EnergySource energySource) { this.energySource = energySource; }

    public Double getEnergyQuantityMWh() { return energyQuantityMWh; }
    public void setEnergyQuantityMWh(Double energyQuantityMWh) { this.energyQuantityMWh = energyQuantityMWh; }

    public String getIssuingOrganization() { return issuingOrganization; }
    public void setIssuingOrganization(String issuingOrganization) { this.issuingOrganization = issuingOrganization; }

    public String getCurrentOwnerOrganization() { return currentOwnerOrganization; }
    public void setCurrentOwnerOrganization(String currentOwnerOrganization) { this.currentOwnerOrganization = currentOwnerOrganization; }

    public LocalDate getIssueDate() { return issueDate; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }

    public CertificateStatus getStatus() { return status; }
    public void setStatus(CertificateStatus status) { this.status = status; }

    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }

    public String getGridRegion() { return gridRegion; }
    public void setGridRegion(String gridRegion) { this.gridRegion = gridRegion; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
