package com.soa.team17.ownership.repository;

import com.soa.team17.ownership.model.OwnershipTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OwnershipTransferRepository extends JpaRepository<OwnershipTransfer, String> {
    List<OwnershipTransfer> findBySerialNumberOrderByTransferredAtDesc(String serialNumber);
}
