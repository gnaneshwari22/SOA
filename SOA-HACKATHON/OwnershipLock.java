package com.soa.team17.ownership.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ownership_locks")
public class OwnershipLock {

    @Id
    @Column(nullable = false, unique = true)
    private String serialNumber;

    @Column(nullable = false)
    private String lockedReason = "RETIRED";

    @Column(nullable = false)
    private String kafkaEventId;

    @Column(nullable = false, updatable = false)
    private LocalDateTime lockedAt = LocalDateTime.now();

    public OwnershipLock() {}

    public OwnershipLock(String serialNumber, String kafkaEventId) {
        this.serialNumber = serialNumber;
        this.kafkaEventId = kafkaEventId;
        this.lockedReason = "RETIRED";
    }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getLockedReason() { return lockedReason; }
    public void setLockedReason(String lockedReason) { this.lockedReason = lockedReason; }

    public String getKafkaEventId() { return kafkaEventId; }
    public void setKafkaEventId(String kafkaEventId) { this.kafkaEventId = kafkaEventId; }

    public LocalDateTime getLockedAt() { return lockedAt; }
    public void setLockedAt(LocalDateTime lockedAt) { this.lockedAt = lockedAt; }
}
