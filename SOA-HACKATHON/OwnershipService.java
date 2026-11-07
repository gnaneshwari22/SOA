package com.soa.team17.ownership.service;

import com.soa.team17.ownership.dto.TransferRequest;
import com.soa.team17.ownership.model.OwnershipTransfer;
import com.soa.team17.ownership.repository.OwnershipLockRepository;
import com.soa.team17.ownership.repository.OwnershipTransferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OwnershipService {

    private final OwnershipTransferRepository transferRepository;
    private final OwnershipLockRepository lockRepository;

    public OwnershipService(OwnershipTransferRepository transferRepository, OwnershipLockRepository lockRepository) {
        this.transferRepository = transferRepository;
        this.lockRepository = lockRepository;
    }

    public List<OwnershipTransfer> getHistory(String serialNumber) {
        return transferRepository.findBySerialNumberOrderByTransferredAtDesc(serialNumber.toUpperCase());
    }

    @Transactional
    public OwnershipTransfer transferOwnership(TransferRequest request, String currentOwner, String callerEmail, String callerOrg, String role) {
        String cleanSerial = request.getSerialNumber().trim().toUpperCase();

        // INVARIANT 1: Reject transfers of retired certificates!
        if (lockRepository.existsBySerialNumber(cleanSerial)) {
            throw new IllegalStateException("Certificate " + cleanSerial + " is RETIRED. Retired certificates can never be transferred.");
        }

        // INVARIANT 2: Authorization check - caller must belong to current owner organization or be registryOfficer
        if (role != null && !role.equals("registryOfficer") && callerOrg != null && !callerOrg.equalsIgnoreCase(currentOwner)) {
            throw new SecurityException("Unauthorized: Organization '" + callerOrg + "' does not own certificate " + cleanSerial);
        }

        OwnershipTransfer transfer = new OwnershipTransfer(
                cleanSerial,
                currentOwner,
                request.getNewOwnerOrganization().trim(),
                callerEmail != null ? callerEmail : "system@soa.org",
                request.getNotes() != null ? request.getNotes() : "Transferred via Ownership Service"
        );

        return transferRepository.save(transfer);
    }
}
