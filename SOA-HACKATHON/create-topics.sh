#!/bin/sh

# ====================================================================
# Topic Initialization Script for SOA Microservices
# Topic: soa.s10.t17.events
# ====================================================================

echo "Creating Kafka topic soa.s10.t17.events with 3 partitions and replication factor 1..."

kafka-topics --create --if-not-exists \
  --bootstrap-server localhost:9092 \
  --topic soa.s10.t17.events \
  --partitions 3 \
  --replication-factor 1 \
  --config cleanup.policy=delete \
  --config retention.ms=604800000

echo "Creating Dead-Letter Queue (DLQ) topic soa.s10.t17.events.DLQ..."

kafka-topics --create --if-not-exists \
  --bootstrap-server localhost:9092 \
  --topic soa.s10.t17.events.DLQ \
  --partitions 1 \
  --replication-factor 1

echo "Topics verified successfully:"
kafka-topics --list --bootstrap-server localhost:9092
