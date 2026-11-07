import sanitizeHtml from "sanitize-html";

const YOUTUBE_HOSTS = ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com"];

/**
 * Blog articles are rendered as raw HTML on the storefront, so anything able to
 * run script is removed. Classes stay because the admin editor styles content
 * with them; inline event handlers and javascript: links do not survive.
 */
export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      "img",
      "iframe",
      "figure",
      "figcaption",
      "del",
      "ins",
      "u",
      "s",
    ],
    allowedAttributes: {
      "*": ["class", "id", "style", "title", "dir", "align"],
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "loading"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s,.%]+\)$/i, /^[a-z]+$/i],
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s,.%]+\)$/i, /^[a-z]+$/i],
        "font-size": [/^\d+(\.\d+)?(px|em|rem|%)$/],
        "font-weight": [/^(bold|normal|\d{3})$/],
        "font-style": [/^(italic|normal)$/],
        "text-decoration": [/^(underline|line-through|none)$/],
        width: [/^\d+(\.\d+)?(px|%)$/],
        height: [/^\d+(\.\d+)?(px|%)$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    allowedIframeHostnames: YOUTUBE_HOSTS,
    transformTags: {
      // A link that opens a new tab must not be able to control this one.
      a: (tagName, attribs) =>
        attribs.target === "_blank"
          ? { tagName, attribs: { ...attribs, rel: "noopener noreferrer" } }
          : { tagName, attribs },
    },
  });
}
