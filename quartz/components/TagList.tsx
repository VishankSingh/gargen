import { FullSlug, resolveRelative } from "../util/path"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const TagList: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const tags = fileData.frontmatter?.tags
  if (tags && tags.length > 0) {
    return (
      <ul class={classNames(displayClass, "tags")}>
        {tags.map((tag) => {
          const linkDest = resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)
          return (
            <li>
              <a href={linkDest} class="internal tag-link">
                {tag}
              </a>
            </li>
          )
        })}
      </ul>
    )
  } else {
    return null
  }
}

TagList.css = `
.tags {
  list-style: none;
  display:flex;
  padding-left: 0;
  gap: 0.4rem;
  margin: 1rem 0;
  flex-wrap: wrap;
}

.section-li > .section > .tags {
  justify-content: flex-end;
}
  
.tags > li {
  display: inline-block;
  white-space: nowrap;
  margin: 0;
  overflow-wrap: normal;
}

a.internal.tag-link {
  font-family: var(--codeFont);
  font-size: 0.75rem;
  color: var(--darkgray);
  background-color: transparent;
  border: 1px solid var(--gray);
  border-radius: var(--radius-none);
  padding: 1px 6px;
  text-decoration: none;
  line-height: 1.4;
  transition: all 0.15s ease;
}

a.internal.tag-link:hover {
  background: var(--dark);
  color: var(--light);
  border-color: var(--dark);
  opacity: 1;
}
`

export default (() => TagList) satisfies QuartzComponentConstructor
