package com.soa.team17.ownership.kafka;

import com.soa.team17.ownership.model.OwnershipLock;
import com.soa.team17.ownership.repository.OwnershipLockRepository;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CertificateRetiredConsumer {

    private static final Logger log = LoggerFactory.getLogger(CertificateRetiredConsumer.class);
    private final OwnershipLockRepository lockRepository;

    // In-memory deduplication cache for consumed event IDs
    private final Set<String> processedEventIds = ConcurrentHashMap.newKeySet();

    public CertificateRetiredConsumer(OwnershipLockRepository lockRepository) {
        this.lockRepository = lockRepository;
    }

    @KafkaListener(topics = "soa.s10.t17.events", groupId = "ownership-service-group")
    public void consume(ConsumerRecord<String, Map<String, Object>> record) {
        Map<String, Object> event = record.value();
        String eventId = (String) event.get("eventId");
        String serialNumber = (String) event.get("aggregateId");
        String schemaVersion = (String) event.get("schemaVersion");

        log.info("Received Kafka event on topic {}: eventId={}, aggregateId={}, schemaVersion={}",
                record.topic(), eventId, serialNumber, schemaVersion);

        // Deduplication filter: Idempotent processing
        if (processedEventIds.contains(eventId)) {
            log.warn("Deduplication: Event {} already processed. Discarding duplicate delivery with 0 business effects.", eventId);
            return;
        }

        if (serialNumber != null) {
            if (!lockRepository.existsBySerialNumber(serialNumber)) {
                OwnershipLock lock = new OwnershipLock(serialNumber, eventId);
                lockRepository.save(lock);
                log.info("Ownership locked for certificate {} following retirement event", serialNumber);
            }
            processedEventIds.add(eventId);
        }
    }
}
