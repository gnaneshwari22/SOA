package com.soa.team17.retirement.controller;

import com.soa.team17.retirement.dto.RetireCertificateRequest;
import com.soa.team17.retirement.model.Retirement;
import com.soa.team17.retirement.service.RetirementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retirements")
public class RetirementController {

    private final RetirementService service;

    public RetirementController(RetirementService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Retirement>> getAll() {
        return ResponseEntity.ok(service.getAllRetirements());
    }

    @GetMapping("/{serialNumber}")
    public ResponseEntity<Retirement> getBySerial(@PathVariable String serialNumber) {
        return ResponseEntity.ok(service.getBySerialNumber(serialNumber));
    }

    @PostMapping
    public ResponseEntity<Retirement> retire(
            @Valid @RequestBody RetireCertificateRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String callerEmail,
            @RequestHeader(value = "X-Correlation-Id", required = false) String correlationId
    ) {
        Retirement record = service.retireCertificate(request, callerEmail, correlationId);
        return ResponseEntity.status(HttpStatus.CREATED).body(record);
    }
}
