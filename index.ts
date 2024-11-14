export interface IsSpamParams {
  content: string;
  spamLinkDomains: string[];
  redirectDepth: number;
}
const extractUrls = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  return urls || [];
};

export const isSpam = (params: IsSpamParams): Promise<boolean> => {
  // 1. content에서 url 식별
  const urls = extractUrls(params.content);
  // content 자체에 url이 없으면 스팸이 아니다.
  if (urls.length == 0) return new Promise((resolve) => resolve(false));

  // 2. 해당 url이 spamLinkDomain인지 확인
  // 3. spamLinkDomain이 아니라면 요청하여 리다이렉션 여부 확인
  // 4. 리다이렉션된 페이지가 spamLinkDomain인지 확인
  // 5. 라디이렉션된 페이지가 spamLinkDomain을 포함하고 있는지 확인
  // 3~5까지는 리다이렉션 뎁스에 대해 재귀 적용 필요
};
