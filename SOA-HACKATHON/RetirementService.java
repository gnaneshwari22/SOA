package com.soa.team17.retirement.service;

import com.soa.team17.retirement.dto.RetireCertificateRequest;
import com.soa.team17.retirement.kafka.KafkaProducerService;
import com.soa.team17.retirement.model.OutboxEvent;
import com.soa.team17.retirement.model.Retirement;
import com.soa.team17.retirement.repository.OutboxEventRepository;
import com.soa.team17.retirement.repository.RetirementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class RetirementService {

    private final RetirementRepository retirementRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final KafkaProducerService kafkaProducerService;

    public RetirementService(RetirementRepository retirementRepository,
                             OutboxEventRepository outboxEventRepository,
                             KafkaProducerService kafkaProducerService) {
        this.retirementRepository = retirementRepository;
        this.outboxEventRepository = outboxEventRepository;
        this.kafkaProducerService = kafkaProducerService;
    }

    public List<Retirement> getAllRetirements() {
        return retirementRepository.findAll();
    }

    public Retirement getBySerialNumber(String serialNumber) {
        return retirementRepository.findBySerialNumber(serialNumber.toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("No retirement record found for serial " + serialNumber));
    }

    @Transactional
    public Retirement retireCertificate(RetireCertificateRequest request, String callerEmail, String correlationId) {
        String cleanSerial = request.getSerialNumber().trim().toUpperCase();

        // CENTRAL BUSINESS RULE: One certificate serial number can be successfully retired only once.
        if (retirementRepository.existsBySerialNumber(cleanSerial)) {
            throw new IllegalStateException("Duplicate Claim Prohibited: Certificate " + cleanSerial +
                    " has already been RETIRED. Once a certificate has been retired, it must never be transferred or retired again.");
        }

        // Generate SHA-256 cryptographic verification seal
        String hashInput = cleanSerial + ":" + request.getClaimReference() + ":" + request.getClaimantOrganization() + ":" + LocalDateTime.now();
        String verificationHash;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(hashInput.getBytes(StandardCharsets.UTF_8));
            verificationHash = HexFormat.of().formatHex(hashBytes);
        } catch (Exception e) {
            verificationHash = UUID.randomUUID().toString().replace("-", "");
        }

        Retirement retirement = new Retirement(
                cleanSerial,
                request.getClaimReference().trim(),
                request.getClaimantOrganization().trim(),
                callerEmail != null ? callerEmail : "system@registry.org",
                request.getPurpose() != null ? request.getPurpose() : "Renewable energy claim reconciliation",
                request.getEnergyQuantityMWh() != null ? request.getEnergyQuantityMWh() : 500.0,
                request.getEnergySource() != null ? request.getEnergySource() : "Solar",
                verificationHash
        );

        Retirement saved = retirementRepository.save(retirement);

        // TRANSACTIONAL OUTBOX: Stage event in DB within the SAME atomic transaction
        String eventId = UUID.randomUUID().toString();
        String corrId = correlationId != null ? correlationId : UUID.randomUUID().toString();

        Map<String, Object> eventPayload = Map.of(
                "eventId", eventId,
                "aggregateId", cleanSerial,
                "schemaVersion", "1.0.0",
                "occurredAt", saved.getRetirementTimestamp().toString(),
                "correlationId", corrId,
                "eventType", "CertificateRetired",
                "payload", Map.of(
                        "serialNumber", cleanSerial,
                        "claimReference", saved.getClaimReference(),
                        "claimantOrganization", saved.getClaimantOrganization(),
                        "energyQuantityMWh", saved.getEnergyQuantityMWh(),
                        "energySource", saved.getEnergySource(),
                        "retirementTimestamp", saved.getRetirementTimestamp().toString(),
                        "retiredBy", saved.getRetiredBy()
                )
        );

        OutboxEvent outbox = new OutboxEvent(cleanSerial, eventPayload.toString(), corrId);
        outboxEventRepository.save(outbox);

        // Publish to Kafka topic: soa.s10.t17.events
        kafkaProducerService.publishEvent("soa.s10.t17.events", cleanSerial, eventPayload);
        outbox.setPublished(true);
        outboxEventRepository.save(outbox);

        return saved;
    }
}
