package com.soa.team17.ownership.controller;

import com.soa.team17.ownership.dto.TransferRequest;
import com.soa.team17.ownership.model.OwnershipTransfer;
import com.soa.team17.ownership.service.OwnershipService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ownership")
public class OwnershipController {

    private final OwnershipService service;

    public OwnershipController(OwnershipService service) {
        this.service = service;
    }

    @GetMapping("/history/{serialNumber}")
    public ResponseEntity<List<OwnershipTransfer>> getHistory(@PathVariable String serialNumber) {
        return ResponseEntity.ok(service.getHistory(serialNumber));
    }

    @PostMapping("/transfer")
    public ResponseEntity<OwnershipTransfer> transfer(
            @Valid @RequestBody TransferRequest request,
            @RequestHeader(value = "X-User-Org", required = false) String callerOrg,
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @RequestParam(value = "currentOwner", defaultValue = "Helios Solar Energy Corp") String currentOwner
    ) {
        OwnershipTransfer result = service.transferOwnership(request, currentOwner, "user@soa.org", callerOrg, callerRole);
        return ResponseEntity.ok(result);
    }
}
