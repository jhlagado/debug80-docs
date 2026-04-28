import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import yaml from "js-yaml";
import { marked } from "marked";

export type FrontMatter = {
  title?: string;
  parent?: string;
  grand_parent?: string;
  nav_order?: number | string;
  has_children?: boolean;
  layout?: string;
};

export type PublicationConfig = {
  root: string;
  title: string;
  description?: string;
};

export type DocPage = {
  filePath: string;
  relativePath: string;
  route: string;
  slug: string;
  publication: PublicationConfig;
  frontmatter: FrontMatter;
  body: string;
  depth: number;
};

export type ReaderSection = {
  page: DocPage;
  title: string;
  anchor: string;
  body: string;
  depth: number;
};

export type NavItem = {
  title: string;
  href: string;
  children: NavItem[];
};

let cachedPages: DocPage[] | undefined;
let cachedPublications: PublicationConfig[] | undefined;

const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
const headingRenderer = new marked.Renderer();

headingRenderer.heading = ({ tokens, depth }) => {
  const text = tokens.map((token) => ("text" in token ? String(token.text) : "")).join(" ");
  const id = slugify(text);
  return `<h${depth} id="${id}">${headingRenderer.parser.parseInline(tokens)} <a class="heading-anchor" href="#${id}" aria-label="Link to this heading">#</a></h${depth}>\n`;
};

marked.setOptions({
  async: false,
  gfm: true,
  renderer: headingRenderer,
});

export function getPublications(): PublicationConfig[] {
  cachedPublications ??= yaml.load(fs.readFileSync("_data/publications.yml", "utf8")) as PublicationConfig[];
  return cachedPublications;
}

export function getPublication(root: string): PublicationConfig | undefined {
  return getPublications().find((publication) => publication.root === root);
}

export function getAllPages(): DocPage[] {
  cachedPages ??= getPublications().flatMap((publication) => orderedPublicationPages(publication));
  return cachedPages;
}

export function getPageBySlug(slug: string): DocPage | undefined {
  return getAllPages().find((page) => page.slug === slug);
}

export function getHomePage(): DocPage {
  return readPage("index.md", {
    root: ".",
    title: "debug80 Docs",
    description: "Technical documentation for the debug80 Z80 debugger extension and the ZAX assembler",
  });
}

export function pageUrl(page: DocPage): string {
  return page.route;
}

export function sitePath(route: string): string {
  return route.startsWith("/") ? route : `/${route}`;
}

export function withBase(route: string): string {
  const base = "/debug80-docs";
  const path = route.startsWith("/") ? route : `/${route}`;
  return `${base}${path}` || "/";
}

export function getNavigation(): NavItem[] {
  return getPublications().map((publication) => {
    const pages = orderedPublicationPages(publication);
    const root = pages[0];
    const children = publicationChildren(root, pages);

    return {
      title: publication.title,
      href: `/${publication.root}/`,
      children: [
        {
          title: "Single-page reader",
          href: `/${publication.root}/single-page/`,
          children: [],
        },
        ...children,
      ],
    };
  });
}

export function markdownToHtml(body: string, page: DocPage, readerAnchors?: Map<string, string>): string {
  const cleanedBody = stripNavigationRows(stripReaderLinks(body));
  return renderMarkdown(rewriteMarkdownLinks(cleanedBody, page, readerAnchors));
}

export function readerMarkdownToHtml(body: string, page: DocPage, sections: ReaderSection[]): string {
  const anchors = new Map(sections.map((section) => [section.page.filePath, section.anchor]));
  return renderMarkdown(rewriteMarkdownLinks(body, page, anchors));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readerAnchor(page: DocPage): string {
  const source = `${page.publication.root}/${page.relativePath}`
    .replace(/\.md$/, "")
    .replace(/\/index$/, "");
  return `reader-${slugify(source)}`;
}

export function getReaderSections(publication: PublicationConfig): ReaderSection[] {
  const pages = orderedPublicationPages(publication);
  return pages.map((page) => ({
    page,
    title: page.frontmatter.title ?? path.basename(page.filePath, ".md"),
    anchor: readerAnchor(page),
    body: removeFirstHeading(stripReaderLinks(stripNavigationRows(page.body))),
    depth: page.depth,
  }));
}

export function stripNavigationRows(body: string): string {
  const lines = splitLines(body);
  while (lines[0]?.trim() === "") {
    lines.shift();
  }
  if (isNavigationRow(lines[0])) {
    lines.shift();
  }
  while (lines.at(-1)?.trim() === "") {
    lines.pop();
  }
  if (isNavigationRow(lines.at(-1))) {
    lines.pop();
  }
  return lines.join("");
}

export function stripReaderLinks(body: string): string {
  return splitLines(body)
    .filter((line) => !(line.includes("single-page/") && /single page/i.test(line)))
    .join("");
}

export function removeFirstHeading(body: string): string {
  const lines = splitLines(body);
  const headingIndex = lines.findIndex((line) => line.startsWith("# "));
  if (headingIndex >= 0) {
    lines.splice(headingIndex, 1);
  }
  return lines.join("");
}

export function routeFromFile(publication: PublicationConfig, relativePath: string): string {
  if (publication.root === "." && relativePath === "index.md") {
    return "";
  }

  const withoutExtension = relativePath.replace(/\.md$/, "");
  const withoutIndex = withoutExtension.replace(/\/index$/, "").replace(/^index$/, "");
  return withoutIndex ? `${publication.root}/${withoutIndex}/` : `${publication.root}/`;
}

function readPage(filePath: string, publication: PublicationConfig): DocPage {
  const parsed = matter(fs.readFileSync(filePath, "utf8"));
  const relativePath = path.relative(publication.root, filePath).replace(/\\/g, "/");
  const route = routeFromFile(publication, relativePath);

  return {
    filePath,
    relativePath,
    route,
    slug: route.replace(/\/$/, ""),
    publication,
    frontmatter: parsed.data as FrontMatter,
    body: parsed.content,
    depth: relativePath.split("/").length - 1,
  };
}

function orderedPublicationPages(publication: PublicationConfig): DocPage[] {
  const pages = walkMarkdownFiles(publication.root).map((filePath) => readPage(filePath, publication));
  const rootPage = pages.find((page) => page.relativePath === "index.md");
  if (!rootPage) {
    throw new Error(`Publication ${publication.root} is missing index.md`);
  }

  const children = new Map<string, DocPage[]>();
  for (const page of pages) {
    if (page === rootPage) {
      continue;
    }
    const parent = parentFor(page, pages) ?? rootPage;
    children.set(parent.filePath, [...(children.get(parent.filePath) ?? []), page]);
  }

  return walkOrder(rootPage, children);
}

function walkMarkdownFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "single-page" ? [] : walkMarkdownFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

function parentFor(page: DocPage, pages: DocPage[]): DocPage | undefined {
  const directoryIndexPath = path.join(path.dirname(page.filePath), "index.md");
  if (
    directoryIndexPath !== page.filePath &&
    fs.existsSync(directoryIndexPath) &&
    !page.frontmatter.grand_parent &&
    page.frontmatter.parent &&
    page.frontmatter.title !== page.frontmatter.parent
  ) {
    return pages.find((candidate) => candidate.filePath === directoryIndexPath);
  }

  const candidates = pages.filter(
    (candidate) => candidate.filePath !== page.filePath && candidate.frontmatter.title === page.frontmatter.parent,
  );

  return (
    candidates.find((candidate) => path.dirname(page.filePath).startsWith(path.dirname(candidate.filePath))) ??
    candidates[0]
  );
}

function publicationChildren(parent: DocPage, pages: DocPage[]): NavItem[] {
  return pages
    .filter((page) => page !== parent && parentFor(page, pages)?.filePath === parent.filePath)
    .sort(comparePages)
    .map((page) => ({
      title: page.frontmatter.title ?? path.basename(page.filePath, ".md"),
      href: `/${page.route}`,
      children: publicationChildren(page, pages),
    }));
}

function walkOrder(page: DocPage, children: Map<string, DocPage[]>): DocPage[] {
  const orderedChildren = [...(children.get(page.filePath) ?? [])].sort(comparePages);
  return [page, ...orderedChildren.flatMap((child) => walkOrder(child, children))];
}

function comparePages(a: DocPage, b: DocPage): number {
  const [aOrder, aName] = sortKey(a);
  const [bOrder, bName] = sortKey(b);
  return aOrder - bOrder || aName.localeCompare(bName);
}

function sortKey(page: DocPage): [number, string] {
  const navOrder = Number(page.frontmatter.nav_order ?? 999);
  return [Number.isFinite(navOrder) ? navOrder : 999, path.basename(page.filePath)];
}

function rewriteMarkdownLinks(body: string, page: DocPage, readerAnchors?: Map<string, string>): string {
  const routeMap = new Map(getAllPages().map((item) => [item.filePath, item.route]));
  return body.replace(markdownLinkPattern, (_match, label: string, target: string) => {
    return `[${label}](${rewriteTarget(page, target, routeMap, readerAnchors)})`;
  });
}

function rewriteTarget(
  page: DocPage,
  target: string,
  routeMap: Map<string, string>,
  readerAnchors?: Map<string, string>,
): string {
  if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) {
    return target;
  }

  const [targetPath, fragment] = target.split("#", 2);
  if (!targetPath.endsWith(".md") && !targetPath.endsWith("README.md") && !targetPath.endsWith("/")) {
    return target;
  }

  const resolved = path
    .resolve(path.dirname(page.filePath), targetPath.endsWith("/") ? path.join(targetPath, "index.md") : targetPath)
    .replace(/README\.md$/, "index.md");

  const readerAnchorTarget = readerAnchors?.get(resolved);
  if (readerAnchorTarget) {
    return `#${readerAnchorTarget}`;
  }

  const route = routeMap.get(resolved);
  if (!route) {
    return target;
  }
  return fragment ? `${route}#${fragment}` : route;
}

function renderMarkdown(body: string): string {
  return marked.parse(body, { async: false }) as string;
}

function splitLines(body: string): string[] {
  return body.match(/[^\n]*\n|[^\n]+$/g) ?? [];
}

function isNavigationRow(line: string | undefined): boolean {
  const text = line?.trim() ?? "";
  return text.startsWith("[") && text.includes("](") && (text.includes(" | ") || text.includes("←") || text.includes("→"));
}

