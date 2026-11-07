package com.soa.team17.retirement.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "retirements", indexes = {
        @Index(name = "idx_retire_serial", columnList = "serialNumber", unique = true),
        @Index(name = "idx_retire_claim", columnList = "claimReference"),
        @Index(name = "idx_retire_claimant", columnList = "claimantOrganization")
})
public class Retirement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // MANDATORY DATABASE INVARIANT: Unique constraint guarantees at most ONE retirement per serial number
    @Column(nullable = false, unique = true, updatable = false)
    private String serialNumber;

    @Column(nullable = false)
    private String claimReference;

    @Column(nullable = false)
    private String claimantOrganization;

    @Column(nullable = false)
    private String retiredBy;

    private String purpose;

    @Column(nullable = false)
    private Double energyQuantityMWh;

    @Column(nullable = false)
    private String energySource;

    @Column(nullable = false)
    private String verificationHash;

    @Column(nullable = false, updatable = false)
    private LocalDateTime retirementTimestamp = LocalDateTime.now();

    public Retirement() {}

    public Retirement(String serialNumber, String claimReference, String claimantOrganization,
                      String retiredBy, String purpose, Double energyQuantityMWh,
                      String energySource, String verificationHash) {
        this.serialNumber = serialNumber;
        this.claimReference = claimReference;
        this.claimantOrganization = claimantOrganization;
        this.retiredBy = retiredBy;
        this.purpose = purpose;
        this.energyQuantityMWh = energyQuantityMWh;
        this.energySource = energySource;
        this.verificationHash = verificationHash;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getClaimReference() { return claimReference; }
    public void setClaimReference(String claimReference) { this.claimReference = claimReference; }

    public String getClaimantOrganization() { return claimantOrganization; }
    public void setClaimantOrganization(String claimantOrganization) { this.claimantOrganization = claimantOrganization; }

    public String getRetiredBy() { return retiredBy; }
    public void setRetiredBy(String retiredBy) { this.retiredBy = retiredBy; }

    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }

    public Double getEnergyQuantityMWh() { return energyQuantityMWh; }
    public void setEnergyQuantityMWh(Double energyQuantityMWh) { this.energyQuantityMWh = energyQuantityMWh; }

    public String getEnergySource() { return energySource; }
    public void setEnergySource(String energySource) { this.energySource = energySource; }

    public String getVerificationHash() { return verificationHash; }
    public void setVerificationHash(String verificationHash) { this.verificationHash = verificationHash; }

    public LocalDateTime getRetirementTimestamp() { return retirementTimestamp; }
    public void setRetirementTimestamp(LocalDateTime retirementTimestamp) { this.retirementTimestamp = retirementTimestamp; }
}
