export interface IsSpamParameters {
  content: string;
  spamLinkDomains: string[];
  redirectDepth: number;
}

export const isSpam = (params: IsSpamParameters): Promise<boolean> => {};
