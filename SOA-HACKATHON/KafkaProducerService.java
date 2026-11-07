package com.soa.team17.retirement.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class KafkaProducerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaProducerService.class);
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public KafkaProducerService(KafkaTemplate<String, Object> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publishEvent(String topic, String aggregateKey, Map<String, Object> event) {
        log.info("Publishing Kafka event to topic {} with aggregateKey {}: eventId={}",
                topic, aggregateKey, event.get("eventId"));

        // Message key = aggregateKey (serial number) to ensure per-certificate ordering
        kafkaTemplate.send(topic, aggregateKey, event).whenComplete((result, ex) -> {
            if (ex == null) {
                log.info("Kafka publication acknowledged: partition={}, offset={}",
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
            } else {
                log.error("Kafka publication failed for aggregateKey {}: {}", aggregateKey, ex.getMessage());
            }
        });
    }
}
