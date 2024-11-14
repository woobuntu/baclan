import { uniq } from "lodash";
import axios from "axios";

export interface IsSpamParams {
  content: string;
  spamLinkDomains: string[];
  redirectDepth: number;
}
const extractUrls = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  return uniq(urls) || [];
};

const urlIncludesDomains = ({
  url,
  spamLinkDomains,
}: {
  url: string;
  spamLinkDomains: string[];
}) => {
  return spamLinkDomains.some((spamLinkDomain) => url.includes(spamLinkDomain));
};

export const isSpam = async (params: IsSpamParams): Promise<boolean> => {
  const { content, spamLinkDomains, redirectDepth } = params;
  // 1. content에서 url 식별
  const urls = extractUrls(content);
  // content 자체에 url이 없으면 스팸이 아니다.
  if (urls.length == 0) return false;

  const visitedLinksHash: Record<string, boolean> = {};

  for (const url of urls) {
    const result = await isUrlSpam({
      url,
      spamLinkDomains,
      redirectDepth,
      visitedLinksHash,
    });

    if (result) return true;
  }

  return false;
};

type IsUrlSpamParams = Omit<IsSpamParams, "content"> & {
  url: string;
  visitedLinksHash: Record<string, boolean>;
};

const isUrlSpam = async (params: IsUrlSpamParams) => {
  const { spamLinkDomains, url, redirectDepth, visitedLinksHash } = params;

  // url 자체가 스팸 링크인지 확인
  if (
    urlIncludesDomains({
      url,
      spamLinkDomains,
    })
  )
    return true;

  // url 자체가 스팸 링크는 아니므로 요청
  try {
    const response = await axios.get(url, {
      maxRedirects: redirectDepth,
    });

    // 리다이렉트된 페이지가 스팸 링크인지 확인
    if (
      response.request?.res?.responseUrl &&
      urlIncludesDomains({
        url: response.request.res.responseUrl,
        spamLinkDomains,
      })
    )
      return true;

    // 리다이렉트된 페이지에 스팸 링크가 포함되어 있으면 스팸
    const linksInHtml = extractUrls(response.data);
    const linksInHtmlNotVisited = linksInHtml.filter(
      (link) => !visitedLinksHash[link]
    );
    if (
      linksInHtmlNotVisited.some((link) =>
        urlIncludesDomains({
          url: link,
          spamLinkDomains,
        })
      )
    )
      return true;

    // 이 시점까지 스팸 링크가 없고, 리다이렉트 뎁쓰가 남아 있으면 추가 요청
    if (redirectDepth > 0) {
      for (const link in linksInHtmlNotVisited) {
        const result = await isUrlSpam({
          url: link,
          spamLinkDomains,
          redirectDepth: redirectDepth - 1,
          visitedLinksHash,
        });

        // 나열된 것 중 하나라도 스팸 링크가 포함되어 있다면 그 즉시 스팸임을 반환
        if (result === true) return true;
      }
    }
  } catch (error) {
    // maxRedirect에 걸려서 에러가 발생한 케이스로, maxRedirect에 걸린 시점의 url이 스팸 링크인지 확인
    if (
      urlIncludesDomains({
        url: (error as any).request._currentUrl,
        spamLinkDomains,
      })
    )
      return true;
  }
  visitedLinksHash[url] = true;
  return false;
};

// 테스트
(async function () {
  //   const result = await isSpam({
  //     content: "spam spam https://moimingg.page.link/exam?_icmp=1",
  //     spamLinkDomains: ["docs.github.com"],
  //     redirectDepth: 1,
  //   });
  //   const result = await isSpam({
  //     content: "spam spam https://moimingg.page.link/exam?_icmp=1",
  //     spamLinkDomains: ["moimingg.page.link"],
  //     redirectDepth: 1,
  //   });
  //   const result = await isSpam({
  //     content: "spam spam https://moimingg.page.link/exam?_icmp=1",
  //     spamLinkDomains: ["github.com"],
  //     redirectDepth: 2,
  //   });
  //   const result = await isSpam({
  //     content: "spam spam https://moimingg.page.link/exam?_icmp=1",
  //     spamLinkDomains: ["docs.github.com"],
  //     redirectDepth: 2,
  //   });
  //   const result = await isSpam({
  //     content: "spam spam https://moimingg.page.link/exam?_icmp=1",
  //     spamLinkDomains: ["docs.github.com"],
  //     redirectDepth: 3,
  //   });
  //   console.log(result);
})();
