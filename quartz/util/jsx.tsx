import { Components, Jsx, toJsxRuntime } from "hast-util-to-jsx-runtime"
import { Node, Root } from "hast"
import { Fragment, jsx, jsxs } from "preact/jsx-runtime"
import { trace } from "./trace"
import { type FilePath } from "./path"

const customComponents: Components = {
  table: (props) => (
    <div class="table-container">
      <table {...props} />
    </div>
  ),
  section: (props) => {
    const isFootnotes =
      props["data-footnotes"] !== undefined ||
      props.dataFootnotes !== undefined ||
      (typeof props.class === "string" && props.class.includes("footnotes")) ||
      (typeof props.className === "string" && props.className.includes("footnotes"))
    if (isFootnotes) {
      return (
        <>
          <hr class="full-width-line content-line-bottom" />
          <section {...props} />
        </>
      )
    }
    return <section {...props} />
  },
}

export function htmlToJsx(fp: FilePath, tree: Node) {
  try {
    return toJsxRuntime(tree as Root, {
      Fragment,
      jsx: jsx as Jsx,
      jsxs: jsxs as Jsx,
      elementAttributeNameCase: "html",
      components: customComponents,
    })
  } catch (e) {
    trace(`Failed to parse Markdown in \`${fp}\` into JSX`, e as Error)
  }
}
