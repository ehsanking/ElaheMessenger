export type GroupKeyAgreementTag = {
    ciphertext: string;
    iv: string;
    authTag: string;
    version: number;
};

/**
 * Legacy compatibility shim for older imports.
 *
 * This module intentionally does not implement custom cryptography.
 * E2EE cryptographic operations are handled by the dedicated runtime in `lib/e2ee-*`.
 */
class GroupEncryption {
    public initializeGroup(_participants: string[]): void {
        void _participants;
        throw new Error('GroupEncryption is deprecated. Use the E2EE runtime services instead.');
    }

    public encryptMessage(_message: string): GroupKeyAgreementTag {
        void _message;
        throw new Error('GroupEncryption is deprecated. Use the E2EE runtime services instead.');
    }

    public decryptMessage(_tag: GroupKeyAgreementTag): string {
        void _tag;
        throw new Error('GroupEncryption is deprecated. Use the E2EE runtime services instead.');
    }

    public updateGroup(_participant: string, _action: 'join' | 'leave'): void {
        void _participant;
        void _action;
        throw new Error('GroupEncryption is deprecated. Use the E2EE runtime services instead.');
    }
}

export default GroupEncryption;
