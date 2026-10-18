export interface ColorScheme {
  light: string
  lightgray: string
  gray: string
  darkgray: string
  dark: string
  secondary: string
  tertiary: string
  highlight: string
  textHighlight: string
}

interface Colors {
  lightMode: ColorScheme
  darkMode: ColorScheme
}

export type FontSpecification =
  | string
  | {
      name: string
      weights?: number[]
      includeItalic?: boolean
      origin?: "googleFonts" | "local"
    }

export interface Theme {
  typography: {
    title?: FontSpecification
    header: FontSpecification
    body: FontSpecification
    code: FontSpecification
  }
  cdnCaching: boolean
  colors: Colors
  fontOrigin: "googleFonts" | "local"
}

export type ThemeKey = keyof Colors

const DEFAULT_SANS_SERIF =
  'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'
const DEFAULT_MONO = "ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace"

export function getFontSpecificationName(spec: FontSpecification): string {
  if (typeof spec === "string") {
    return spec
  }

  return spec.name
}

export function getFontOrigin(
  spec: FontSpecification | undefined,
  defaultOrigin: "googleFonts" | "local" = "local",
): "googleFonts" | "local" {
  if (!spec) return defaultOrigin
  if (typeof spec === "object" && spec.origin) {
    return spec.origin
  }
  return defaultOrigin
}

function formatFontSpecification(
  type: "title" | "header" | "body" | "code",
  spec: FontSpecification,
) {
  if (typeof spec === "string") {
    spec = { name: spec }
  }

  const defaultIncludeWeights = type === "header" ? [400, 700] : [400, 600]
  const defaultIncludeItalic = type === "body"
  const weights = spec.weights ?? defaultIncludeWeights
  const italic = spec.includeItalic ?? defaultIncludeItalic

  const features: string[] = []
  if (italic) {
    features.push("ital")
  }

  if (weights.length > 1) {
    const weightSpec = italic
      ? weights
          .flatMap((w) => [`0,${w}`, `1,${w}`])
          .sort()
          .join(";")
      : weights.join(";")

    features.push(`wght@${weightSpec}`)
  }

  const name = spec.name.replaceAll(" ", "+")
  if (features.length > 0) {
    return `${name}:${features.join(",")}`
  }

  return name
}

export function googleFontHref(theme: Theme): string | undefined {
  const { title, header, body, code } = theme.typography
  const familyMap = new Map<string, { weights: Set<number>; italic: boolean }>()

  const specs = [
    { type: "title", spec: title },
    { type: "header", spec: header },
    { type: "body", spec: body },
    { type: "code", spec: code },
  ] as const

  for (const { type, spec } of specs) {
    if (!spec) continue

    const origin = getFontOrigin(spec, theme.fontOrigin)
    if (origin !== "googleFonts") {
      continue
    }

    const name = getFontSpecificationName(spec)
    const normalizedSpec = typeof spec === "string" ? { name: spec } : spec
    const defaultIncludeWeights = type === "header" ? [400, 700] : [400, 600]
    const defaultIncludeItalic = type === "body"

    const weights = normalizedSpec.weights ?? defaultIncludeWeights
    const italic = normalizedSpec.includeItalic ?? defaultIncludeItalic

    if (!familyMap.has(name)) {
      familyMap.set(name, { weights: new Set(), italic: false })
    }
    const entry = familyMap.get(name)!
    for (const w of weights) {
      entry.weights.add(w)
    }
    if (italic) {
      entry.italic = true
    }
  }

  if (familyMap.size === 0) {
    return undefined
  }

  const familyParams: string[] = []
  for (const [name, { weights, italic }] of familyMap.entries()) {
    const formattedName = name.replaceAll(" ", "+")
    const sortedWeights = [...weights].sort((a, b) => a - b)

    if (sortedWeights.length === 0) {
      familyParams.push(`family=${formattedName}`)
      continue
    }

    if (italic) {
      const tuples: string[] = []
      for (const w of sortedWeights) {
        tuples.push(`0,${w}`)
        tuples.push(`1,${w}`)
      }
      familyParams.push(`family=${formattedName}:ital,wght@${tuples.sort().join(";")}`)
    } else {
      familyParams.push(`family=${formattedName}:wght@${sortedWeights.join(";")}`)
    }
  }

  return `https://fonts.googleapis.com/css2?${familyParams.join("&")}&display=swap`
}

export function googleFontSubsetHref(theme: Theme, text: string): string | undefined {
  const title = theme.typography.title ?? theme.typography.header
  if (getFontOrigin(title, theme.fontOrigin) !== "googleFonts") {
    return undefined
  }
  const titleFont = formatFontSpecification("title", title)

  return `https://fonts.googleapis.com/css2?family=${titleFont}&text=${encodeURIComponent(text)}&display=swap`
}

export interface GoogleFontFile {
  url: string
  filename: string
  extension: string
}

const fontMimeMap: Record<string, string> = {
  truetype: "ttf",
  woff: "woff",
  woff2: "woff2",
  opentype: "otf",
}

export async function processGoogleFonts(
  stylesheet: string,
  baseUrl: string,
): Promise<{
  processedStylesheet: string
  fontFiles: GoogleFontFile[]
}> {
  const fontSourceRegex =
    /url\((https:\/\/fonts.gstatic.com\/.+(?:\/|(?:kit=))(.+?)[.&].+?)\)\sformat\('(\w+?)'\);/g
  const fontFiles: GoogleFontFile[] = []
  let processedStylesheet = stylesheet

  let match
  while ((match = fontSourceRegex.exec(stylesheet)) !== null) {
    const url = match[1]
    const filename = match[2]
    const extension = fontMimeMap[match[3].toLowerCase()]
    const staticUrl = `https://${baseUrl}/static/fonts/${filename}.${extension}`

    processedStylesheet = processedStylesheet.replace(url, staticUrl)
    fontFiles.push({ url, filename, extension })
  }

  return { processedStylesheet, fontFiles }
}

export function joinStyles(theme: Theme, ...stylesheet: string[]) {
  return `
${stylesheet.join("\n\n")}

:root {
  --light: ${theme.colors.lightMode.light};
  --lightgray: ${theme.colors.lightMode.lightgray};
  --gray: ${theme.colors.lightMode.gray};
  --darkgray: ${theme.colors.lightMode.darkgray};
  --dark: ${theme.colors.lightMode.dark};
  --secondary: ${theme.colors.lightMode.secondary};
  --tertiary: ${theme.colors.lightMode.tertiary};
  --highlight: ${theme.colors.lightMode.highlight};
  --textHighlight: ${theme.colors.lightMode.textHighlight};

  --titleFont: "${getFontSpecificationName(theme.typography.title || theme.typography.header)}", ${DEFAULT_SANS_SERIF};
  --headerFont: "${getFontSpecificationName(theme.typography.header)}", ${DEFAULT_SANS_SERIF};
  --bodyFont: "${getFontSpecificationName(theme.typography.body)}", ${DEFAULT_SANS_SERIF};
  --codeFont: "${getFontSpecificationName(theme.typography.code)}", ${DEFAULT_MONO};
}

:root[saved-theme="dark"] {
  --light: ${theme.colors.darkMode.light};
  --lightgray: ${theme.colors.darkMode.lightgray};
  --gray: ${theme.colors.darkMode.gray};
  --darkgray: ${theme.colors.darkMode.darkgray};
  --dark: ${theme.colors.darkMode.dark};
  --secondary: ${theme.colors.darkMode.secondary};
  --tertiary: ${theme.colors.darkMode.tertiary};
  --highlight: ${theme.colors.darkMode.highlight};
  --textHighlight: ${theme.colors.darkMode.textHighlight};
}
`
}
