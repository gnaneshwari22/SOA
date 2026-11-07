package com.soa.team17.certificate;

import com.soa.team17.certificate.dto.IssueCertificateRequest;
import com.soa.team17.certificate.model.Certificate;
import com.soa.team17.certificate.model.CertificateStatus;
import com.soa.team17.certificate.model.EnergySource;
import com.soa.team17.certificate.repository.CertificateRepository;
import com.soa.team17.certificate.service.CertificateService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CertificateServiceTest {

    @Mock
    private CertificateRepository repository;

    @InjectMocks
    private CertificateService service;

    @Test
    void testValidCertificateIssuance() {
        IssueCertificateRequest req = new IssueCertificateRequest();
        req.setSerialNumber("REC101");
        req.setEnergySource(EnergySource.Solar);
        req.setEnergyQuantityMWh(500.0);
        req.setCurrentOwnerOrganization("Helios Solar Energy Corp");
        req.setIssueDate(LocalDate.now());

        when(repository.existsBySerialNumber("REC101")).thenReturn(false);
        when(repository.save(any(Certificate.class))).thenAnswer(i -> i.getArgument(0));

        Certificate cert = service.issueCertificate(req, "Global Clean Energy Registry");

        assertThat(cert).isNotNull();
        assertThat(cert.getSerialNumber()).isEqualTo("REC101");
        assertThat(cert.getStatus()).isEqualTo(CertificateStatus.ACTIVE);
        assertThat(cert.getEnergyQuantityMWh()).isEqualTo(500.0);
    }

    @Test
    void testDuplicateSerialNumberRejection() {
        IssueCertificateRequest req = new IssueCertificateRequest();
        req.setSerialNumber("REC101");
        req.setEnergySource(EnergySource.Solar);
        req.setEnergyQuantityMWh(500.0);
        req.setCurrentOwnerOrganization("Helios Solar Energy Corp");

        when(repository.existsBySerialNumber("REC101")).thenReturn(true);

        assertThatThrownBy(() -> service.issueCertificate(req, "Global Registry"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Duplicate serial numbers are prohibited");
    }
}
