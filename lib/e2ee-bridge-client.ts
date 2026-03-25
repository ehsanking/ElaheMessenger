import { createRegistrationBundleV2, persistRegistrationBundleV2 } from '@/lib/e2ee-registration';
import { encryptAttachment } from '@/lib/e2ee-attachments';

export async function prepareRegistrationBundleForServer() {
  const bundle = await createRegistrationBundleV2();
  await persistRegistrationBundleV2(bundle);

  const response = await fetch('/api/e2ee/register-bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agreementPublicKey: bundle.agreementPublicKey,
      signingPublicKey: bundle.signingPublicKey,
      signedPreKey: bundle.signedPreKey,
      signedPreKeySig: bundle.signedPreKeySig,
    }),
  });

  return response.json();
}

export async function uploadEncryptedAttachment(options: {
  file: File;
  conversationKey: CryptoKey;
  conversationId: string;
}) {
  const envelope = await encryptAttachment(options.file, options.conversationKey, options.conversationId);
  const formData = new FormData();
  formData.append('file', new File([await envelope.ciphertext.arrayBuffer()], `${options.file.name}.bin`, { type: 'application/octet-stream' }));
  formData.append('conversationId', options.conversationId);
  formData.append('wrappedFileKey', envelope.wrappedFileKey);
  formData.append('wrappedFileKeyNonce', envelope.wrappedFileKeyNonce);
  formData.append('fileNonce', envelope.fileNonce);
  formData.append('e2eeVersion', 'v2');

  const response = await fetch('/api/upload-secure', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  return response.json();
}
