package com.soa.team17.certificate.service;

import com.soa.team17.certificate.dto.IssueCertificateRequest;
import com.soa.team17.certificate.model.Certificate;
import com.soa.team17.certificate.model.CertificateStatus;
import com.soa.team17.certificate.repository.CertificateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class CertificateService {

    private final CertificateRepository repository;

    public CertificateService(CertificateRepository repository) {
        this.repository = repository;
    }

    public List<Certificate> getAllCertificates() {
        return repository.findAll();
    }

    public Certificate getBySerialNumber(String serialNumber) {
        return repository.findBySerialNumber(serialNumber.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Certificate with serial number " + serialNumber + " not found"));
    }

    @Transactional
    public Certificate issueCertificate(IssueCertificateRequest request, String issuingOrg) {
        String cleanSerial = request.getSerialNumber().trim().toUpperCase();

        if (repository.existsBySerialNumber(cleanSerial)) {
            throw new IllegalStateException("Certificate with serial number " + cleanSerial + " already exists. Duplicate serial numbers are prohibited.");
        }

        Certificate cert = new Certificate(
                cleanSerial,
                request.getEnergySource(),
                request.getEnergyQuantityMWh(),
                issuingOrg != null ? issuingOrg : "Global Clean Energy Registry",
                request.getCurrentOwnerOrganization().trim(),
                request.getIssueDate() != null ? request.getIssueDate() : LocalDate.now(),
                request.getFacilityName(),
                request.getGridRegion()
        );

        return repository.save(cert);
    }

    @Transactional
    public Certificate updateStatus(String serialNumber, CertificateStatus newStatus) {
        Certificate cert = getBySerialNumber(serialNumber);
        cert.setStatus(newStatus);
        return repository.save(cert);
    }
}
