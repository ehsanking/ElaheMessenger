export const E2EE_POLICY = {
  directMessages: {
    status: 'targeted',
    description: '1:1 conversations are the only supported target for runtime E2EE in the current phase 3 rollout.',
  },
  groups: {
    status: 'not-e2ee-yet',
    description: 'Group and channel messages are not end-to-end encrypted yet. They require explicit group key management before the product can claim E2EE for groups.',
  },
  attachments: {
    status: 'secure-route-available',
    description: 'Encrypted attachment upload is available only through the secure upload route and should not use the legacy public upload flow.',
  },
} as const;

export function getGroupE2EEWarning() {
  return 'Group and channel E2EE is not available yet.';
}
