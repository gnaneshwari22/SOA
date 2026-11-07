package com.soa.team17.ownership.repository;

import com.soa.team17.ownership.model.OwnershipLock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OwnershipLockRepository extends JpaRepository<OwnershipLock, String> {
    boolean existsBySerialNumber(String serialNumber);
}
