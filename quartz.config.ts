import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Gargen",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "vishanksingh.github.io/gargen",
    ignorePatterns: ["private", "templates"],
    defaultDateType: "created",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        title: {
          name: "Google Sans",
          origin: "googleFonts",
        },
        header: {
          name: "Google Sans",
          weights: [400, 600, 700],
          origin: "googleFonts",
        },
        body: {
          name: "Google Sans",
          origin: "googleFonts",
        },
        code: {
          name: " JetBrains Mono ",
          origin: "googleFonts",
        },
      },
      colors: {
        lightMode: {
          light: "rgb(255, 252, 240)",
          lightgray: "rgb(230, 228, 217)",
          gray: "rgb(183, 181, 172)",
          darkgray: "rgb(111, 110, 105)",
          dark: "rgb(16, 15, 15)",
          secondary: "rgb(205, 213, 151)",
          tertiary: "rgb(252, 193, 146)",
          highlight: "rgba(209, 77, 65, 0.15)",
          textHighlight: "rgb(253, 178, 162)",
        },
        darkMode: {
          light: "rgb(16, 15, 15)",
          lightgray: "rgb(40, 39, 38)",
          gray: "rgb(87, 86, 83)",
          darkgray: "rgb(135, 133, 128)",
          dark: "rgb(206, 205, 195)",
          secondary: "rgb(205, 213, 151)",
          tertiary: "rgb(252, 193, 146)",
          highlight: "rgba(209, 77, 65, 0.25)",
          textHighlight: "rgb(140, 48, 40)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.Poetry(),
      Plugin.Latex({ renderEngine: "katex" }),
      Plugin.SyntaxHighlighting(),
      Plugin.ObsidianFlavoredMarkdown({
        enableInHtmlEmbed: false,
        parseTags: false,
        mermaid: false,
      }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "absolute", lazyLoad: true }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      // Plugin.CustomOgImages(),
      Plugin.LazyScripts({
        scripts: [{ name: "departureBoard", entry: "components/scripts/departureBoard.lazy.ts" }],
      }),
    ],
  },
}

export default config
