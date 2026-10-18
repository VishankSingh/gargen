import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Header: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return children.length > 0 ? (
    <section class="header-container">
      <header class="header-content" style={{ position: "relative", left: "80px" }}>{children}</header>
    </section>
  ) : null
}

Header.css = `
.header-container {
  width: 100%;
  position: sticky;
  top: 0;
  z-index: 500;
  background-color: var(--light);
  border-bottom: 1px solid var(--lightgray);
  box-sizing: border-box;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.6rem 1.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  box-sizing: border-box;

  & > :nth-last-child(2) {
    margin-left: auto;
  }
}

@media all and (max-width: 800px) {
  .header-content {
    padding: 0.5rem 1rem;
    gap: 0.5rem;
  }
}
`

export default (() => Header) satisfies QuartzComponentConstructor
