import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/backlinks.scss"
import { resolveRelative, simplifySlug } from "../util/path"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"
import { unescapeHTML } from "../util/escape"

interface BacklinksOptions {
  hideWhenEmpty: boolean
}

const defaultOptions: BacklinksOptions = {
  hideWhenEmpty: true,
}

export default ((opts?: Partial<BacklinksOptions>) => {
  const options: BacklinksOptions = { ...defaultOptions, ...opts }

  const Backlinks: QuartzComponent = ({
    fileData,
    allFiles,
    displayClass,
    cfg,
  }: QuartzComponentProps) => {
    const slug = simplifySlug(fileData.slug!)
    const backlinkFiles = allFiles.filter((file) => file.links?.includes(slug))
    if (options.hideWhenEmpty && backlinkFiles.length == 0) {
      return null
    }
    return (
      <div class={classNames(displayClass, "backlinks")}>
        <h2>{i18n(cfg.locale).components.backlinks.title}</h2>
        <ul class="overflow">
          {backlinkFiles.length > 0 ? (
            backlinkFiles.map((f) => {
              const rawDesc = f.frontmatter?.description ?? f.description
              const desc = rawDesc ? unescapeHTML(rawDesc) : undefined
              return (
                <li>
                  <a href={resolveRelative(fileData.slug!, f.slug!)} class="internal">
                    <span class="backlink-title">{f.frontmatter?.title}</span>
                    {desc && <span class="backlink-desc">{desc}</span>}
                  </a>
                </li>
              )
            })
          ) : (
            <li>{i18n(cfg.locale).components.backlinks.noBacklinksFound}</li>
          )}
        </ul>
      </div>
    )
  }

  Backlinks.css = style

  return Backlinks
}) satisfies QuartzComponentConstructor
