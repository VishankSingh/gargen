import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return <h1 class={classNames(displayClass, "article-title")}>{title}</h1>
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  font-family: var(--titleFont, var(--headerFont));
  font-size: 2.6rem;
  /* font-weight: 700; */
  font-weight: 400;
  color: var(--dark);
  line-height: 1.15;
  margin: 1.5rem 0 0.5rem 0;
  text-wrap: balance;
}
`

export default (() => ArticleTitle) satisfies QuartzComponentConstructor
