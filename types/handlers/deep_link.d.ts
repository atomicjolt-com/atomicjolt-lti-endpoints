import type { Context } from 'hono';
export declare const deepLinkVersion = "1.3.0";
export declare enum ContentItem {
    File = "file",
    HtmlFragment = "html",
    Image = "image",
    Link = "link",
    LTIResourceLink = "ltiResourceLink"
}
export declare function handleSignDeepLink(c: Context): Promise<Response>;
//# sourceMappingURL=deep_link.d.ts.map