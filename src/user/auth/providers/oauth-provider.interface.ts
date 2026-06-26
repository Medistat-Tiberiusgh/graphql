export interface ExternalIdentity {
  providerUid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
}

export interface OAuthProvider {
  readonly name: string;

  exchangeCode(
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ): Promise<ExternalIdentity>;
}
