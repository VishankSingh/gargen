import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"
import { SimpleSlug } from "./quartz/util/path"

const recentNotes = [
  Component.RecentNotes({
    title: "Selected Writing",
    limit: 4,
    filter: (f) =>
      f.slug!.startsWith("posts/") &&
      f.slug! !== "posts/index" &&
      !f.frontmatter?.noindex &&
      !(f.frontmatter?.tags ?? []).includes("personal"),
    linkToMore: "posts/" as SimpleSlug,
  }),
  Component.RecentNotes({
    title: "Recent Notes",
    limit: 2,
    filter: (f) => f.slug!.startsWith("thoughts/"),
    linkToMore: "thoughts/" as SimpleSlug,
  }),
]

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [
    Component.Breadcrumbs({
      rootName: "~",
      spacerSymbol: "/",
    }),
    Component.Search(),
    Component.Darkmode(),
  ],
  afterBody: [
    Component.ConditionalRender({
      component: Component.Flex({
        direction: "column",
        gap: "1.5rem",
        components: recentNotes.map((c) => ({ Component: c, align: "stretch" })),
      }),
      condition: (props) => props.fileData.slug === "index",
    }),
    Component.ConditionalRender({
      component: Component.Backlinks(),
      condition: (props) => props.fileData.slug !== "index",
    }),
  ],
  footer: Component.Footer({
    links: {
      "GNU AGPL-3.0": "https://www.gnu.org/licenses/agpl-3.0.html",
      GitHub: "https://github.com/vishanksingh",
      // Twitter: "https://twitter.com/",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.DesktopOnly(Component.TableOfContents({ layout: "minimal" })),
  ],
  right: [],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.ArticleTitle(),
    Component.ContentMeta(),
  ],
  left: [],
  right: [],
}
