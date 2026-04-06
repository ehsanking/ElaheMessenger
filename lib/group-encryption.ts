// group-encryption.ts

import { GroupKeyAgreement, GroupKeyAgreementTag } from 'mls-protocol';

/**
 * This class implements group message encryption using TreeKEM
 * from the Messaging Layer Security protocol.
 */
class GroupEncryption {
    private groupKeyAgreement: GroupKeyAgreement;

    constructor() {
        this.groupKeyAgreement = new GroupKeyAgreement();
    }

    /**
     * Initializes the group with a list of participants.
     * @param participants - An array of participant identifiers.
     */
    public initializeGroup(participants: string[]): void {
        this.groupKeyAgreement.initialize(participants);
    }

    /**
     * Encrypts a message for all participants in the group.
     * @param message - The message to encrypt.
     * @returns The encrypted message.
     */
    public encryptMessage(message: string): GroupKeyAgreementTag {
        const encryptedMessage = this.groupKeyAgreement.encrypt(message);
        return encryptedMessage;
    }

    /**
     * Decrypts a message received from another group participant.
     * @param tag - The encrypted message tag.
     * @returns The decrypted message.
     */
    public decryptMessage(tag: GroupKeyAgreementTag): string {
        const decryptedMessage = this.groupKeyAgreement.decrypt(tag);
        return decryptedMessage;
    }

    /**
     * Updates the group key agreement state if a participant joins or leaves.
     * @param participant - Identifier of the participant.
     * @param action - 'join' or 'leave'.
     */
    public updateGroup(participant: string, action: 'join' | 'leave'): void {
        if (action === 'join') {
            this.groupKeyAgreement.addParticipant(participant);
        } else if (action === 'leave') {
            this.groupKeyAgreement.removeParticipant(participant);
        }
    }
}

export default GroupEncryption;
