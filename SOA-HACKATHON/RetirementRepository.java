package com.soa.team17.retirement.repository;

import com.soa.team17.retirement.model.Retirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RetirementRepository extends JpaRepository<Retirement, String> {
    Optional<Retirement> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);
    List<Retirement> findByClaimantOrganizationIgnoreCase(String claimantOrganization);
}
