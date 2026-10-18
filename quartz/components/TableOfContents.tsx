import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import legacyStyle from "./styles/legacyToc.scss"
import modernStyle from "./styles/toc.scss"
import { classNames } from "../util/lang"

// @ts-ignore
import script from "./scripts/toc.inline"
import { i18n } from "../i18n"
import OverflowListFactory from "./OverflowList"
import { concatenateResources } from "../util/resources"

interface Options {
  layout: "minimal" | "modern" | "legacy"
}

const defaultOptions: Options = {
  layout: "minimal",
}

let numTocs = 0
export default ((opts?: Partial<Options>) => {
  const layout = opts?.layout ?? defaultOptions.layout
  const { OverflowList, overflowListAfterDOMLoaded } = OverflowListFactory()

  const TableOfContents: QuartzComponent = ({
    fileData,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    if (!fileData.toc || fileData.toc.length === 0) {
      return null
    }

    if (layout === "minimal") {
      return (
        <div class={classNames(displayClass, "toc")} id="toc" data-layout="minimal">
          <nav id="toc-vertical" aria-label="Table of Contents">
            {fileData.toc.map((entry, idx) => (
              <button
                key={entry.slug}
                class={`depth-${entry.depth} toc-item`}
                data-depth={entry.depth}
                data-href={`#${entry.slug}`}
                data-for={entry.slug}
                tabindex={-1}
                type="button"
                style={{ "--animation-order": idx + 1 }}
                aria-label={entry.text}
              >
                <div class="fill" />
                <div class="indicator">{entry.text}</div>
              </button>
            ))}
          </nav>
          <div class="toc-label" aria-hidden="true" />
        </div>
      )
    }

    const id = `toc-${numTocs++}`
    return (
      <div class={classNames(displayClass, "toc")} id="toc" data-layout="modern">
        <button
          type="button"
          class={fileData.collapseToc ? "collapsed toc-header" : "toc-header"}
          aria-controls={id}
          aria-expanded={!fileData.collapseToc}
        >
          <h3>{i18n(cfg.locale).components.tableOfContents.title}</h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <OverflowList
          id={id}
          class={fileData.collapseToc ? "collapsed toc-content" : "toc-content"}
        >
          {fileData.toc.map((tocEntry) => (
            <li key={tocEntry.slug} class={`depth-${tocEntry.depth}`}>
              <a href={`#${tocEntry.slug}`} data-for={tocEntry.slug}>
                {tocEntry.text}
              </a>
            </li>
          ))}
        </OverflowList>
      </div>
    )
  }

  TableOfContents.css = modernStyle
  TableOfContents.afterDOMLoaded = concatenateResources(script, overflowListAfterDOMLoaded)

  const LegacyTableOfContents: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
    if (!fileData.toc || fileData.toc.length === 0) {
      return null
    }
    return (
      <details class="toc" open={!fileData.collapseToc}>
        <summary>
          <h3>{i18n(cfg.locale).components.tableOfContents.title}</h3>
        </summary>
        <ul>
          {fileData.toc.map((tocEntry) => (
            <li key={tocEntry.slug} class={`depth-${tocEntry.depth}`}>
              <a href={`#${tocEntry.slug}`} data-for={tocEntry.slug}>
                {tocEntry.text}
              </a>
            </li>
          ))}
        </ul>
      </details>
    )
  }
  LegacyTableOfContents.css = legacyStyle

  return layout === "legacy" ? LegacyTableOfContents : TableOfContents
}) satisfies QuartzComponentConstructor
