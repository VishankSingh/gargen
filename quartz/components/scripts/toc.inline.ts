let tocCleanup: (() => void) | null = null
const tocScrollBuffer = 48
const tocHoverSigma = 36
const tocHoverRadius = tocHoverSigma * 3
const tocHoverLerp = 0.35
const tocHoverEpsilon = 0.08
const headingSelector = "h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]"

interface TocButtonMetric {
  button: HTMLButtonElement
  fill: HTMLElement | null
  centerY: number
  label: string
  touched: boolean
}

let activeToc: HTMLDivElement | null = null
let tocEntryBySlug = new Map<string, HTMLElement>()

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    const slug = entry.target.id
    const tocEntryElement = tocEntryBySlug.get(slug)
    if (!tocEntryElement) continue

    const toc = activeToc
    if (!toc) continue

    const windowHeight = entry.rootBounds?.height
    if (!windowHeight) continue

    const layout = toc.dataset.layout
    if (layout === "minimal") {
      continue
    }

    const inView = entry.boundingClientRect.y < windowHeight
    tocEntryElement.classList.toggle("in-view", inView)
    tocEntryElement.parentElement?.classList.toggle("in-view", inView)
  }
})

function onClick(evt: MouseEvent) {
  if (!(evt.target instanceof Element)) return

  const button = evt.target.closest<HTMLButtonElement>("button[data-href]")
  if (!button) return

  const href = button.dataset.href
  if (!href?.startsWith("#")) return

  evt.preventDefault()
  scrollToElement(href)

  const toc = button.closest<HTMLElement>(".toc")
  if (toc) {
    toc.classList.add("is-hovering")
    const label = toc.querySelector<HTMLElement>(".toc-label")
    const nav = toc.querySelector<HTMLElement>("#toc-vertical")
    if (label) {
      const nextLabel = button.getAttribute("aria-label") ?? ""
      if (label.textContent !== nextLabel) {
        label.textContent = nextLabel
      }
      const labelY = button.offsetTop + button.offsetHeight / 2 - (nav?.scrollTop ?? 0)
      label.style.transform = `translate3d(0, ${labelY.toFixed(1)}px, 0) translateY(-50%)`
      toc.style.setProperty("--toc-label-y", `${labelY.toFixed(1)}px`)
      label.classList.add("is-visible")
    }
  }
}

function scrollToElement(hash: string) {
  const elementId = hash.slice(1)
  const element = document.getElementById(elementId)
  if (!element) return

  const rect = element.getBoundingClientRect()
  const absoluteTop = window.scrollY + rect.top

  window.scrollTo({ top: absoluteTop - 90, behavior: "smooth" })
  history.pushState(null, "", hash)
}

function resetTocButtons(buttons?: NodeListOf<HTMLButtonElement>) {
  buttons?.forEach(resetTocButton)
}

function resetTocButton(button: HTMLButtonElement) {
  const fill = button.querySelector<HTMLElement>(".fill")
  button.classList.remove("is-active")
  if (!fill) return

  fill.style.animation = "none"
  fill.style.transform = "scaleX(1)"
  fill.style.opacity = ""
}

function readTocButtonMetrics(buttons: NodeListOf<HTMLButtonElement>): TocButtonMetric[] {
  const metrics: TocButtonMetric[] = []
  buttons.forEach((button) => {
    metrics.push({
      button,
      fill: button.querySelector<HTMLElement>(".fill"),
      centerY: button.offsetTop + button.offsetHeight / 2,
      label: button.getAttribute("aria-label") ?? "",
      touched: false,
    })
  })
  return metrics
}

function readTocMaxScale(nav: HTMLElement, metrics: TocButtonMetric[]): number {
  return 1.35
}

function firstTocMetricIndexAt(metrics: TocButtonMetric[], centerY: number): number {
  let low = 0
  let high = metrics.length
  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if (metrics[mid].centerY < centerY) {
      low = mid + 1
    } else {
      high = mid
    }
  }
  return low
}

function nearestTocMetric(
  metrics: TocButtonMetric[],
  centerY: number,
  currentMetric: TocButtonMetric | null = null,
): TocButtonMetric | null {
  if (metrics.length === 0) return null
  const nextIndex = firstTocMetricIndexAt(metrics, centerY)
  const previous = metrics[nextIndex - 1]
  const next = metrics[nextIndex]
  if (!previous) return next ?? null
  if (!next) return previous

  const distPrev = Math.abs(centerY - previous.centerY)
  const distNext = Math.abs(centerY - next.centerY)

  const hysteresis = 3
  if (currentMetric && currentMetric.button === previous.button) {
    return distNext < distPrev - hysteresis ? next : previous
  } else if (currentMetric && currentMetric.button === next.button) {
    return distPrev < distNext - hysteresis ? previous : next
  }

  return distPrev <= distNext ? previous : next
}

function updateTocButtonFill(metric: TocButtonMetric, mouseY: number, maxScale: number): void {
  const { fill } = metric
  if (!fill) return

  const distance = mouseY - metric.centerY
  const falloff = Math.exp(-(distance * distance) / (2 * tocHoverSigma * tocHoverSigma))
  const scale = 1 + (maxScale - 1) * falloff

  fill.style.animation = "none"
  fill.style.transform = `scaleX(${scale.toFixed(3)})`
}

function hideTocLabel(toc: HTMLElement) {
  const label = toc.querySelector<HTMLElement>(".toc-label")
  if (label) {
    label.classList.remove("is-visible")
    label.getAnimations?.().forEach((anim) => anim.cancel())
  }
}

function updateTocLabel(
  toc: HTMLElement,
  metric: TocButtonMetric,
  activeButton: HTMLButtonElement | null,
  nav: HTMLElement,
): HTMLButtonElement {
  const { button } = metric
  const label = toc.querySelector<HTMLElement>(".toc-label")
  if (!label) return button

  if (button !== activeButton) {
    activeButton?.classList.remove("is-active")
    button.classList.add("is-active")

    const labelY = button.offsetTop + button.offsetHeight / 2 - nav.scrollTop
    label.style.transform = `translate3d(0, ${labelY.toFixed(1)}px, 0) translateY(-50%)`
    toc.style.setProperty("--toc-label-y", `${labelY.toFixed(1)}px`)

    if (label.textContent !== metric.label) {
      label.textContent = metric.label
    }
  }

  label.classList.add("is-visible")
  return button
}

function updateTocOverflow(nav: HTMLElement) {
  const scrollable = nav.scrollHeight > nav.clientHeight + 1
  const atStart = nav.scrollTop <= 1
  const atEnd = nav.scrollTop + nav.clientHeight >= nav.scrollHeight - 1

  nav.classList.toggle("is-scrollable", scrollable)
  nav.classList.toggle("at-start", scrollable && atStart)
  nav.classList.toggle("at-end", scrollable && atEnd)
}

function scrollTocButtonIntoView(button: HTMLButtonElement) {
  const nav = button.closest<HTMLElement>("#toc-vertical")
  if (!nav || nav.scrollHeight <= nav.clientHeight + 1) return

  const navRect = nav.getBoundingClientRect()
  const buttonRect = button.getBoundingClientRect()
  const before = buttonRect.top - navRect.top - tocScrollBuffer
  const after = buttonRect.bottom - navRect.bottom + tocScrollBuffer
  let nextScroll = nav.scrollTop

  if (before < 0) {
    nextScroll += before
  } else if (after > 0) {
    nextScroll += after
  }

  if (Math.abs(nextScroll - nav.scrollTop) >= 1) {
    nav.scrollTop = nextScroll
  }
}

function cleanupToc() {
  tocCleanup?.()
  tocCleanup = null
}

function cacheTocEntries() {
  activeToc = document.querySelector<HTMLDivElement>(".toc")
  tocEntryBySlug = new Map()
  activeToc?.querySelectorAll<HTMLElement>("[data-for]").forEach((entry) => {
    const slug = entry.dataset.for
    if (slug) tocEntryBySlug.set(slug, entry)
  })
}

function tocHeadingTargets(): HTMLElement[] {
  const article = document.querySelector<HTMLElement>("article")
  if (!article) return []

  const headingById = new Map<string, HTMLElement>()
  article.querySelectorAll<HTMLElement>(headingSelector).forEach((heading) => {
    if (!headingById.has(heading.id)) headingById.set(heading.id, heading)
  })

  const targets: HTMLElement[] = []
  for (const slug of tocEntryBySlug.keys()) {
    const heading = headingById.get(slug)
    if (heading) targets.push(heading)
  }
  return targets
}

function updateTocInView() {
  const toc = activeToc
  if (!toc) return
  if (toc.dataset.layout !== "minimal") return

  const header = document.querySelector<HTMLElement>(".header-container")
  const headerBottom = header ? header.getBoundingClientRect().bottom : 50
  const topThreshold = headerBottom + 50

  const atPageBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 30

  const targets = tocHeadingTargets()
  let lastReachedButton: HTMLButtonElement | null = null

  for (const heading of targets) {
    const slug = heading.id
    const tocEntryElement = tocEntryBySlug.get(slug)
    if (!tocEntryElement) continue

    const rect = heading.getBoundingClientRect()
    const reachedTop = rect.top <= topThreshold || (atPageBottom && rect.top < window.innerHeight)

    tocEntryElement.classList.toggle("in-view", reachedTop)
    if (reachedTop && tocEntryElement instanceof HTMLButtonElement) {
      lastReachedButton = tocEntryElement
    }
  }

  if (lastReachedButton) {
    scrollTocButtonIntoView(lastReachedButton)
  }
}

function adjustFullWidthLines() {
  const lines = document.querySelectorAll<HTMLElement>("hr.full-width-line")
  if (lines.length === 0) return
  const vw = document.documentElement.clientWidth || window.innerWidth
  lines.forEach((line) => {
    const parent = line.parentElement
    if (!parent) return
    const parentRect = parent.getBoundingClientRect()
    line.style.width = `${vw}px`
    line.style.marginLeft = `${-parentRect.left}px`
    line.style.left = "0"
    line.style.transform = "none"
  })
}

function setupToc() {
  cleanupToc()
  adjustFullWidthLines()

  // Support modern collapsible layout fallback if layout is not minimal
  for (const toc of document.querySelectorAll<HTMLElement>(".toc:not([data-layout='minimal'])")) {
    const button = toc.querySelector<HTMLElement>(".toc-header")
    const content = toc.querySelector<HTMLElement>(".toc-content")
    if (button && content) {
      const toggle = () => {
        button.classList.toggle("collapsed")
        content.classList.toggle("collapsed")
      }
      button.addEventListener("click", toggle)
      window.addCleanup(() => button.removeEventListener("click", toggle))
    }
  }

  const toc = document.querySelector<HTMLElement>(".toc[data-layout='minimal']")
  if (!toc) return

  if (getComputedStyle(toc).display === "none") return

  const nav = toc.querySelector<HTMLElement>("#toc-vertical")
  if (!nav) return

  const buttons = toc.querySelectorAll<HTMLButtonElement>("button[data-for]")
  if (buttons.length === 0) return

  const controller = new AbortController()
  const { signal } = controller
  let metrics = readTocButtonMetrics(buttons)
  let maxScale = readTocMaxScale(nav, metrics)

  const topLine = document.querySelector<HTMLElement>("hr.content-line-top")
  const bottomLine = document.querySelector<HTMLElement>("hr.content-line-bottom")

  const updateTocPosition = () => {
    adjustFullWidthLines()
    updateTocInView()
    if (!topLine && !bottomLine) return

    const tocHeight = nav.offsetHeight || toc.offsetHeight
    const preferredTop = Math.min(Math.max(104, 0.25 * window.innerHeight), 192)
    const buffer = 16

    let minTop = -Infinity
    if (topLine) {
      const topRect = topLine.getBoundingClientRect()
      minTop = topRect.bottom + buffer
    }

    let maxTop = Infinity
    if (bottomLine) {
      const bottomRect = bottomLine.getBoundingClientRect()
      maxTop = bottomRect.top - tocHeight - buffer
    }

    let targetTop: number
    if (maxTop < minTop) {
      targetTop = minTop
    } else {
      targetTop = Math.max(minTop, Math.min(preferredTop, maxTop))
    }

    toc.style.top = `${targetTop}px`
  }

  window.addEventListener("scroll", updateTocPosition, { passive: true, signal })
  window.addEventListener("resize", updateTocPosition, { passive: true, signal })
  updateTocPosition()

  let frame = 0
  let currentMouseY = 0
  let targetMouseY = 0
  let activeButton: HTMLButtonElement | null = null
  let activeMetric: TocButtonMetric | null = null
  let hovering = false
  let touchedMetrics: TocButtonMetric[] = []
  let nextTouchedMetrics: TocButtonMetric[] = []

  const refreshTocGeometry = () => {
    metrics = readTocButtonMetrics(buttons)
    maxScale = readTocMaxScale(nav, metrics)
    updateTocOverflow(nav)
  }

  const scheduleHover = () => {
    if (frame === 0) {
      frame = requestAnimationFrame(updateHover)
    }
  }

  const onMouseEnter = (evt: MouseEvent) => {
    hovering = true
    toc.classList.add("is-hovering")
    const navRect = nav.getBoundingClientRect()
    targetMouseY = evt.clientY - navRect.top
    currentMouseY = targetMouseY
    const contentMouseY = currentMouseY + nav.scrollTop
    const initialMetric = nearestTocMetric(metrics, contentMouseY, activeMetric)
    if (initialMetric) {
      activeMetric = initialMetric
      const label = toc.querySelector<HTMLElement>(".toc-label")
      if (label) {
        label.style.transition = "none"
      }
      activeButton = updateTocLabel(toc, initialMetric, activeButton, nav)
      if (label) {
        void label.offsetHeight
        label.style.transition = ""
      }
    }
    scheduleHover()
  }

  const onMouseLeave = () => {
    hovering = false
    toc.classList.remove("is-hovering")
    if (frame !== 0) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    activeButton?.classList.remove("is-active")
    activeButton = null
    activeMetric = null
    hideTocLabel(toc)
    resetTocButtons(buttons)
    touchedMetrics.length = 0
    nextTouchedMetrics.length = 0
  }

  const updateHover = () => {
    frame = 0
    currentMouseY += (targetMouseY - currentMouseY) * tocHoverLerp

    const contentMouseY = currentMouseY + nav.scrollTop
    nextTouchedMetrics.length = 0
    const startIndex = firstTocMetricIndexAt(metrics, contentMouseY - tocHoverRadius)
    const endIndex = firstTocMetricIndexAt(metrics, contentMouseY + tocHoverRadius)

    for (let index = startIndex; index < endIndex; index++) {
      const metric = metrics[index]
      metric.touched = true
      updateTocButtonFill(metric, contentMouseY, maxScale)
      nextTouchedMetrics.push(metric)
    }

    for (const metric of touchedMetrics) {
      if (!metric.touched) {
        resetTocButton(metric.button)
      }
    }

    for (const metric of nextTouchedMetrics) {
      metric.touched = false
    }

    const previousTouchedMetrics = touchedMetrics
    touchedMetrics = nextTouchedMetrics
    nextTouchedMetrics = previousTouchedMetrics

    const actualContentMouseY = targetMouseY + nav.scrollTop
    const nearestMetric = nearestTocMetric(metrics, actualContentMouseY, activeMetric)
    if (nearestMetric) {
      activeMetric = nearestMetric
      activeButton = updateTocLabel(toc, nearestMetric, activeButton, nav)
    }

    if (hovering && Math.abs(targetMouseY - currentMouseY) > tocHoverEpsilon) {
      scheduleHover()
    }
  }

  const onPointerMove = (evt: PointerEvent) => {
    const navRect = nav.getBoundingClientRect()
    targetMouseY = evt.clientY - navRect.top

    if (!hovering) {
      hovering = true
      toc.classList.add("is-hovering")
      currentMouseY = targetMouseY
      const contentMouseY = currentMouseY + nav.scrollTop
      const initialMetric = nearestTocMetric(metrics, contentMouseY, activeMetric)
      if (initialMetric) {
        activeMetric = initialMetric
        const label = toc.querySelector<HTMLElement>(".toc-label")
        if (label) {
          label.style.transition = "none"
        }
        activeButton = updateTocLabel(toc, initialMetric, activeButton, nav)
        if (label) {
          void label.offsetHeight
          label.style.transition = ""
        }
      }
    }

    scheduleHover()
  }

  nav.addEventListener("click", onClick, { signal })
  nav.addEventListener("mouseenter", onMouseEnter, { signal })
  nav.addEventListener("mouseleave", onMouseLeave, { signal })
  nav.addEventListener("pointerleave", onMouseLeave, { signal })
  nav.addEventListener("pointermove", onPointerMove, { passive: true, signal })
  toc.addEventListener("mouseleave", onMouseLeave, { signal })
  toc.addEventListener("pointerleave", onMouseLeave, { signal })
  window.addEventListener("blur", onMouseLeave, { signal })
  document.addEventListener("pointerleave", onMouseLeave, { signal })
  nav.addEventListener(
    "scroll",
    () => {
      updateTocOverflow(nav)
      if (toc.classList.contains("is-hovering")) {
        if (activeMetric) {
          const label = toc.querySelector<HTMLElement>(".toc-label")
          if (label) {
            const labelY =
              activeMetric.button.offsetTop + activeMetric.button.offsetHeight / 2 - nav.scrollTop
            label.style.transform = `translate3d(0, ${labelY.toFixed(1)}px, 0) translateY(-50%)`
            toc.style.setProperty("--toc-label-y", `${labelY.toFixed(1)}px`)
          }
        }
        scheduleHover()
      }
    },
    { passive: true, signal },
  )

  tocCleanup = () => {
    controller.abort()
    if (frame !== 0) {
      cancelAnimationFrame(frame)
      frame = 0
    }
    activeButton?.classList.remove("is-active")
    activeButton = null
    activeMetric = null
    toc.classList.remove("is-hovering")
    hideTocLabel(toc)
    resetTocButtons(buttons)
    touchedMetrics.length = 0
    nextTouchedMetrics.length = 0
    toc.style.top = ""
  }

  requestAnimationFrame(refreshTocGeometry)
}

window.addEventListener("resize", () => {
  adjustFullWidthLines()
  cacheTocEntries()
  setupToc()
  updateTocInView()
})
document.addEventListener("nav", () => {
  adjustFullWidthLines()
  cacheTocEntries()
  setupToc()
  observer.disconnect()
  tocHeadingTargets().forEach((header) => observer.observe(header))
  updateTocInView()

  window.addCleanup(() => {
    cleanupToc()
  })
})
