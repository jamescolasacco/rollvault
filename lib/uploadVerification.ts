type UploadVerificationState = {
  emailVerified: boolean;
};

export function getMissingUploadVerifications(state: UploadVerificationState): string[] {
  const missing: string[] = [];

  if (!state.emailVerified) {
    missing.push("email verification");
  }

  return missing;
}

export function buildUploadVerificationMessage(state: UploadVerificationState): string | null {
  const missing = getMissingUploadVerifications(state);

  if (missing.length === 0) {
    return null;
  }

  return `Complete ${missing[0]} to upload images.`;
}

export function canUploadImages(state: UploadVerificationState): boolean {
  return getMissingUploadVerifications(state).length === 0;
}
