package com.soa.team17.retirement;

import com.soa.team17.retirement.dto.RetireCertificateRequest;
import com.soa.team17.retirement.kafka.KafkaProducerService;
import com.soa.team17.retirement.model.OutboxEvent;
import com.soa.team17.retirement.model.Retirement;
import com.soa.team17.retirement.repository.OutboxEventRepository;
import com.soa.team17.retirement.repository.RetirementRepository;
import com.soa.team17.retirement.service.RetirementService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RetirementServiceTest {

    @Mock
    private RetirementRepository retirementRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private KafkaProducerService kafkaProducerService;

    @InjectMocks
    private RetirementService service;

    @Test
    void testSuccessfulRetirementTransaction() {
        RetireCertificateRequest req = new RetireCertificateRequest();
        req.setSerialNumber("REC101");
        req.setClaimReference("CLAIM001");
        req.setClaimantOrganization("EcoTech Industries Inc");
        req.setEnergyQuantityMWh(500.0);
        req.setEnergySource("Solar");

        when(retirementRepository.existsBySerialNumber("REC101")).thenReturn(false);
        when(retirementRepository.save(any(Retirement.class))).thenAnswer(i -> i.getArgument(0));

        Retirement result = service.retireCertificate(req, "corporate@eco-tech.com", "corr-123");

        assertThat(result).isNotNull();
        assertThat(result.getSerialNumber()).isEqualTo("REC101");
        assertThat(result.getClaimReference()).isEqualTo("CLAIM001");
        assertThat(result.getVerificationHash()).isNotEmpty();

        // Verify outbox and Kafka was invoked
        verify(outboxEventRepository, atLeastOnce()).save(any(OutboxEvent.class));
        verify(kafkaProducerService, times(1)).publishEvent(eq("soa.s10.t17.events"), eq("REC101"), any());
    }

    @Test
    void testRejectionOfSecondRetirement() {
        RetireCertificateRequest req = new RetireCertificateRequest();
        req.setSerialNumber("REC101");
        req.setClaimReference("CLAIM002-DUPLICATE");
        req.setClaimantOrganization("Rogue Claimant Corp");

        // Simulate certificate is ALREADY retired
        when(retirementRepository.existsBySerialNumber("REC101")).thenReturn(true);

        assertThatThrownBy(() -> service.retireCertificate(req, "rogue@claimant.com", "corr-456"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Duplicate Claim Prohibited")
                .hasMessageContaining("already been RETIRED");

        // Verify zero Kafka events published for rejected attempt
        verifyNoInteractions(kafkaProducerService);
    }
}
