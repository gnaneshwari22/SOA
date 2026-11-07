package com.soa.team17.ownership;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class OwnershipApplication {
    public static void main(String[] args) {
        SpringApplication.run(OwnershipApplication.class, args);
    }
}
