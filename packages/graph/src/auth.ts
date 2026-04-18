import {
  PublicClientApplication,
  type AuthorizationUrlRequest,
  type AuthorizationCodeRequest,
  type Configuration,
} from '@azure/msal-node';

export const GRAPH_SCOPES = [
  'offline_access',
  'Files.Read.All',
  'User.Read',
];

export interface MsalEnv {
  clientId: string;
  tenantId: string; // "consumers" for personal accounts
  redirectUri: string;
}

export function buildMsalClient(env: MsalEnv): PublicClientApplication {
  const cfg: Configuration = {
    auth: {
      clientId: env.clientId,
      authority: `https://login.microsoftonline.com/${env.tenantId}`,
    },
  };
  return new PublicClientApplication(cfg);
}

export async function getAuthUrl(
  pca: PublicClientApplication,
  env: MsalEnv,
  state: string,
): Promise<string> {
  const req: AuthorizationUrlRequest = {
    scopes: GRAPH_SCOPES,
    redirectUri: env.redirectUri,
    state,
  };
  return pca.getAuthCodeUrl(req);
}

export async function exchangeCode(
  pca: PublicClientApplication,
  env: MsalEnv,
  code: string,
) {
  const req: AuthorizationCodeRequest = {
    code,
    scopes: GRAPH_SCOPES,
    redirectUri: env.redirectUri,
  };
  return pca.acquireTokenByCode(req);
}
