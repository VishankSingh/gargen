import { pathToRoot } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

const PageTitle: QuartzComponent = ({ fileData, cfg, displayClass }: QuartzComponentProps) => {
  const title = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title
  const baseDir = pathToRoot(fileData.slug!)
  return (
    <h2 class={classNames(displayClass, "page-title")}>
      <a href={baseDir}>{title}</a>
    </h2>
  )
}

PageTitle.css = `
.page-title {
  font-family: var(--titleFont, var(--headerFont));
  font-size: 1.75rem;
  /* font-weight: 700; */
  font-weight: 400;
  margin: 0;
  white-space: nowrap;

  a {
    color: var(--dark);
    text-decoration: none;

    &:hover {
      background: none;
      color: var(--dark);
    }
  }
}
`

export default (() => PageTitle) satisfies QuartzComponentConstructor
