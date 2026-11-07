package com.soa.team17.ownership;

import com.soa.team17.ownership.dto.TransferRequest;
import com.soa.team17.ownership.model.OwnershipTransfer;
import com.soa.team17.ownership.repository.OwnershipLockRepository;
import com.soa.team17.ownership.repository.OwnershipTransferRepository;
import com.soa.team17.ownership.service.OwnershipService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class OwnershipServiceTest {

    @Mock
    private OwnershipTransferRepository transferRepository;

    @Mock
    private OwnershipLockRepository lockRepository;

    @InjectMocks
    private OwnershipService service;

    @Test
    void testValidOwnershipTransfer() {
        TransferRequest req = new TransferRequest();
        req.setSerialNumber("REC101");
        req.setNewOwnerOrganization("EcoTech Industries Inc");

        when(lockRepository.existsBySerialNumber("REC101")).thenReturn(false);
        when(transferRepository.save(any(OwnershipTransfer.class))).thenAnswer(i -> i.getArgument(0));

        OwnershipTransfer result = service.transferOwnership(req, "Helios Solar Energy Corp", "user@helios.com", "Helios Solar Energy Corp", "certificateOwner");

        assertThat(result).isNotNull();
        assertThat(result.getSerialNumber()).isEqualTo("REC101");
        assertThat(result.getPreviousOwner()).isEqualTo("Helios Solar Energy Corp");
        assertThat(result.getNewOwner()).isEqualTo("EcoTech Industries Inc");
    }

    @Test
    void testRejectionOfTransferForRetiredCertificate() {
        TransferRequest req = new TransferRequest();
        req.setSerialNumber("REC101");
        req.setNewOwnerOrganization("EcoTech Industries Inc");

        when(lockRepository.existsBySerialNumber("REC101")).thenReturn(true);

        assertThatThrownBy(() -> service.transferOwnership(req, "Helios Solar Energy Corp", "user@helios.com", "Helios Solar Energy Corp", "certificateOwner"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("RETIRED. Retired certificates can never be transferred");
    }

    @Test
    void testRejectionOfUnauthorizedCrossTenantTransfer() {
        TransferRequest req = new TransferRequest();
        req.setSerialNumber("REC101");
        req.setNewOwnerOrganization("Rogue Buyer LLC");

        when(lockRepository.existsBySerialNumber("REC101")).thenReturn(false);

        assertThatThrownBy(() -> service.transferOwnership(req, "Helios Solar Energy Corp", "trader@boreas.com", "Boreas Wind Parks LLC", "certificateOwner"))
                .isInstanceOf(SecurityException.class)
                .hasMessageContaining("does not own certificate");
    }
}
