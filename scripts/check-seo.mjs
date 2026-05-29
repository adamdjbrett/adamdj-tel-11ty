import fs from "node:fs";
import path from "node:path";

const siteDir = path.join(process.cwd(), "_site");
const siteOrigin = "https://www.adamdj.tel";
const minTitleLength = 40;
const minDescriptionLength = 120;
const maxDescriptionLength = 200;

function walkFiles(dir, predicate) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkFiles(full, predicate));
			continue;
		}
		if (entry.isFile() && predicate(full)) {
			files.push(full);
		}
	}
	return files;
}

function normalizeWhitespace(value) {
	return value.replace(/\s+/g, " ").trim();
}

function getAttributes(tag) {
	const attrs = {};
	const body = tag.replace(/^<\s*[^\s>]+\s*/i, "").replace(/\/?>$/i, "");
	const attrPattern = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
	for (const match of body.matchAll(attrPattern)) {
		const key = match[1].toLowerCase();
		attrs[key] = match[2] ?? match[3] ?? match[4] ?? "";
	}
	return attrs;
}

function getHead(html) {
	const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
	return match ? match[1] : "";
}

function getTitle(head) {
	const match = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
	return match ? normalizeWhitespace(match[1]) : "";
}

function getMetaContent(head, name) {
	for (const tag of head.match(/<meta\b[^>]*>/gi) || []) {
		const attrs = getAttributes(tag);
		if ((attrs.name || "").toLowerCase() === name.toLowerCase()) {
			return normalizeWhitespace(attrs.content || "");
		}
	}
	return "";
}

function getCanonical(head) {
	for (const tag of head.match(/<link\b[^>]*>/gi) || []) {
		const attrs = getAttributes(tag);
		const rel = (attrs.rel || "").toLowerCase().split(/\s+/);
		if (rel.includes("canonical")) {
			return attrs.href || "";
		}
	}
	return "";
}

function extractSitemapPaths() {
	const sitemapPath = path.join(siteDir, "sitemap.xml");
	if (!fs.existsSync(sitemapPath)) {
		return { paths: new Set(), errors: ["Missing /sitemap.xml in built output."] };
	}

	const xml = fs.readFileSync(sitemapPath, "utf8");
	const paths = new Set();
	const errors = [];
	for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/gi)) {
		const loc = normalizeWhitespace(match[1]);
		try {
			const parsed = new URL(loc);
			if (parsed.origin !== siteOrigin) {
				errors.push(`Sitemap URL uses unexpected origin: ${loc}`);
			}
			paths.add(parsed.pathname);
		} catch {
			errors.push(`Sitemap URL is invalid: ${loc}`);
		}
	}
	return { paths, errors };
}

function readDisallowedPaths() {
	const robotsPath = path.join(siteDir, "robots.txt");
	if (!fs.existsSync(robotsPath)) {
		return [];
	}
	const robots = fs.readFileSync(robotsPath, "utf8");
	return [...robots.matchAll(/^\s*Disallow:\s*(\S+)/gim)].map((match) => match[1]);
}

function urlPathForHtml(file) {
	const relative = file.replace(siteDir, "").replaceAll(path.sep, "/");
	if (relative === "/index.html") {
		return "/";
	}
	if (relative.endsWith("/index.html")) {
		return relative.slice(0, -"index.html".length);
	}
	return relative;
}

function fileForUrlPath(urlPath) {
	if (urlPath.endsWith("/")) {
		return path.join(siteDir, urlPath, "index.html");
	}
	return path.join(siteDir, urlPath);
}

function isDisallowed(urlPath, disallowedPaths) {
	return disallowedPaths.some((rule) => rule !== "" && urlPath.startsWith(rule));
}

if (!fs.existsSync(siteDir)) {
	console.error('[check:seo] Missing _site. Run "npm run build" first.');
	process.exit(1);
}

const failures = [];
const { paths: sitemapPaths, errors: sitemapErrors } = extractSitemapPaths();
failures.push(...sitemapErrors);

const disallowedPaths = readDisallowedPaths();
for (const sitemapPath of sitemapPaths) {
	const targetFile = fileForUrlPath(sitemapPath);
	if (!fs.existsSync(targetFile)) {
		failures.push(`Sitemap URL has no generated HTML file: ${sitemapPath}`);
	}
	if (isDisallowed(sitemapPath, disallowedPaths)) {
		failures.push(`Sitemap URL is disallowed in robots.txt: ${sitemapPath}`);
	}
}

for (const file of walkFiles(siteDir, (candidate) => candidate.endsWith(".html"))) {
	const html = fs.readFileSync(file, "utf8");
	const urlPath = urlPathForHtml(file);
	if (isDisallowed(urlPath, disallowedPaths)) {
		continue;
	}

	const head = getHead(html);
	if (!head) {
		failures.push(`${urlPath} is missing a <head> section.`);
		continue;
	}

	const headEnd = html.search(/<\/head>/i);
	const bodyTitle = headEnd >= 0 ? html.slice(headEnd).match(/<title\b/i) : null;
	if (bodyTitle) {
		failures.push(`${urlPath} contains a <title> element outside the document head.`);
	}

	const robots = getMetaContent(head, "robots").toLowerCase();
	if (robots.includes("noindex")) {
		if (sitemapPaths.has(urlPath)) {
			failures.push(`${urlPath} is noindex but appears in sitemap.xml.`);
		}
		continue;
	}

	const title = getTitle(head);
	if (title.length < minTitleLength) {
		failures.push(`${urlPath} has a short title (${title.length} chars): ${title}`);
	}

	const description = getMetaContent(head, "description");
	if (description.length < minDescriptionLength) {
		failures.push(`${urlPath} has a short meta description (${description.length} chars).`);
	}
	if (description.length > maxDescriptionLength) {
		failures.push(`${urlPath} has an overlong meta description (${description.length} chars).`);
	}

	const canonical = getCanonical(head);
	if (!canonical) {
		failures.push(`${urlPath} is missing a canonical URL.`);
	} else if (!canonical.startsWith(`${siteOrigin}/`) && canonical !== `${siteOrigin}/`) {
		failures.push(`${urlPath} has an unexpected canonical URL: ${canonical}`);
	}

	if (!robots.includes("index") || !robots.includes("follow")) {
		failures.push(`${urlPath} is missing an explicit index, follow robots directive.`);
	}

	if (!sitemapPaths.has(urlPath)) {
		failures.push(`${urlPath} is indexable but absent from sitemap.xml.`);
	}
}

if (failures.length > 0) {
	console.error(`[check:seo] Found ${failures.length} SEO/indexing issue(s):`);
	for (const failure of failures) {
		console.error(`- ${failure}`);
	}
	process.exit(1);
}

console.log("[check:seo] Built pages pass title, description, canonical, robots, and sitemap checks.");
