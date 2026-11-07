package com.soa.team17.certificate.repository;

import com.soa.team17.certificate.model.Certificate;
import com.soa.team17.certificate.model.CertificateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, String> {
    Optional<Certificate> findBySerialNumber(String serialNumber);
    boolean existsBySerialNumber(String serialNumber);
    List<Certificate> findByCurrentOwnerOrganizationIgnoreCase(String owner);
    List<Certificate> findByStatus(CertificateStatus status);
}
