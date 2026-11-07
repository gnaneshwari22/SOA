package com.soa.team17.ownership.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ownership_transfers", indexes = {
        @Index(name = "idx_trn_serial", columnList = "serialNumber")
})
public class OwnershipTransfer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String serialNumber;

    @Column(nullable = false)
    private String previousOwner;

    @Column(nullable = false)
    private String newOwner;

    @Column(nullable = false)
    private String transferredBy;

    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime transferredAt = LocalDateTime.now();

    public OwnershipTransfer() {}

    public OwnershipTransfer(String serialNumber, String previousOwner, String newOwner, String transferredBy, String notes) {
        this.serialNumber = serialNumber;
        this.previousOwner = previousOwner;
        this.newOwner = newOwner;
        this.transferredBy = transferredBy;
        this.notes = notes;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getPreviousOwner() { return previousOwner; }
    public void setPreviousOwner(String previousOwner) { this.previousOwner = previousOwner; }

    public String getNewOwner() { return newOwner; }
    public void setNewOwner(String newOwner) { this.newOwner = newOwner; }

    public String getTransferredBy() { return transferredBy; }
    public void setTransferredBy(String transferredBy) { this.transferredBy = transferredBy; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getTransferredAt() { return transferredAt; }
    public void setTransferredAt(LocalDateTime transferredAt) { this.transferredAt = transferredAt; }
}
