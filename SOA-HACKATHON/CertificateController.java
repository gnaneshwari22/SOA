package com.soa.team17.certificate.controller;

import com.soa.team17.certificate.dto.IssueCertificateRequest;
import com.soa.team17.certificate.model.Certificate;
import com.soa.team17.certificate.model.CertificateStatus;
import com.soa.team17.certificate.service.CertificateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService service;

    public CertificateController(CertificateService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<Certificate>> getAll() {
        return ResponseEntity.ok(service.getAllCertificates());
    }

    @GetMapping("/{serialNumber}")
    public ResponseEntity<Certificate> getBySerial(@PathVariable String serialNumber) {
        return ResponseEntity.ok(service.getBySerialNumber(serialNumber));
    }

    @PostMapping
    public ResponseEntity<Certificate> issue(
            @Valid @RequestBody IssueCertificateRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Org", required = false) String org
    ) {
        // Enforce role policy: Only registryOfficer can issue certificates
        if (role != null && !role.equals("registryOfficer")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Certificate created = service.issueCertificate(request, org);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{serialNumber}/status")
    public ResponseEntity<Certificate> updateStatus(
            @PathVariable String serialNumber,
            @RequestParam CertificateStatus status
    ) {
        return ResponseEntity.ok(service.updateStatus(serialNumber, status));
    }
}
