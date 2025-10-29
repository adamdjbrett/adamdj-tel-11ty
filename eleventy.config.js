import { IdAttributePlugin, InputPathToUrlTransformPlugin, HtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import pluginFilters from "./_config/filters.js";
import fs from "fs";
import CleanCSS from "clean-css";
import postCSS from 'postcss';
import purgeCSS from '@fullhuman/postcss-purgecss';
import pluginFontAwesome from '@11ty/font-awesome'

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function(eleventyConfig) {
	// Drafts, see also _data/eleventyDataSchema.js
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if(data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
			return false;
		}
	});

	// CSS minification filter
	eleventyConfig.addFilter("cssmin", function (code) {
		return new CleanCSS({}).minify(code).styles;
	});
	// FontAwesome plugin
eleventyConfig.addPlugin(pluginFontAwesome, {
	transform: 'i[class]',
	shortcode: false,
	failOnError: true,
	defaultAttributes: {
		class: 'icon-svg',
	},
	});
eleventyConfig.addTransform('purge-and-inline-css', async (content, outputPath) => {
	if (process.env.ELEVENTY_ENV !== 'production' || !outputPath.endsWith('.html')) {
		return content;
	}

	// Only run when the template explicitly opts-in with a placeholder
	const placeholder = '<!-- INLINE CSS-->';
	if (!content.includes(placeholder)) {
		return content;
	}

	try {
		// Read CSS from public passthrough (served at /css/*)
		const cssFiles = ['public/css/index.css', 'public/css/main.css', 'public/css/404.css'].filter(p => fs.existsSync(p));
		if (cssFiles.length === 0) {
			return content; // nothing to inline
		}
		const rawCss = cssFiles.map(p => fs.readFileSync(p, 'utf8')).join('\n');

		// Purge against the current HTML content
		const purgeResult = await postCSS([
			purgeCSS({
				content: [{ raw: content, extension: 'html' }],
				keyframes: true,
			})
		]).process(rawCss, { from: undefined });

		// Minify and inline
		const minified = new CleanCSS({}).minify(purgeResult.css || '').styles;
		return content.replace(placeholder, `<style>${minified}</style>`);
	} catch (e) {
		// Fail-safe: don't break the build if purge/minify fails
		return content;
	}
});
	eleventyConfig
		.addPassthroughCopy({
			"./public/": "/"
		})
		.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");

	// Run Eleventy when these files change:
	// https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

	// Watch content images for the image pipeline.
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");

	// Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
	// Adds the {% css %} paired shortcode
	eleventyConfig.addBundle("css", {
		toFileDirectory: "dist",
	});
	// Adds the {% js %} paired shortcode
	eleventyConfig.addBundle("js", {
		toFileDirectory: "dist",
	});

	// Official plugins
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: { tabindex: 0 }
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", // or "rss", "json"
		outputPath: "/feed/feed.xml",
		stylesheet: "pretty-atom-feed.xsl",
		templateData: {
			eleventyNavigation: {
				key: "Feed",
				order: 4
			}
		},
		collection: {
			name: "posts",
			limit: 10,
		},
		metadata: {
			language: "en",
			title: "Adam DJ Brett",
			subtitle: "I am the grant and event coordinator on the Doctrine of Discovery Project. My PhD is Religion from Syracuse University where I specialized in U.S. religion and the impact of Protestant fundamentalism on religion, politics, and culture.",
			base: "https://www.adamdj.tel",
			author: {
				name: "Adam DJ Brett"
			}
		}
	});

	// Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
	// Disabled because images are already optimized in public/img folder
	// eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
	// 	// File extensions to process in _site folder
	// 	extensions: "html",

	// 	// Output formats for each image.
	// 	formats: ["avif", "webp", "auto"],

	// 	// widths: ["auto"],

	// 	defaultAttributes: {
	// 		// e.g. <img loading decoding> assigned on the HTML tag will override these values.
	// 		loading: "lazy",
	// 		decoding: "async",
	// 	},
		
	// 	// Skip optimization for passthrough-copied images from /img/
	// 	transformOnRequest: false
	// });

	// Filters
	eleventyConfig.addPlugin(pluginFilters);

	eleventyConfig.addPlugin(IdAttributePlugin, {
		// by default we use Eleventy’s built-in `slugify` filter:
		// slugify: eleventyConfig.getFilter("slugify"),
		// selector: "h1,h2,h3,h4,h5,h6", // default
	});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return (new Date()).toISOString();
	});

	// Features to make your build faster (when you need them)

	// If your passthrough copy gets heavy and cumbersome, add this line
	// to emulate the file copy on the dev server. Learn more:
	// https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

	// eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
};

export const config = {
	// Control which files Eleventy will process
	// e.g.: *.md, *.njk, *.html, *.liquid
	templateFormats: [
		"md",
		"njk",
		"html",
		"liquid",
		"11ty.js",
	],

	// Pre-process *.md files with: (default: `liquid`)
	markdownTemplateEngine: "njk",

	// Pre-process *.html files with: (default: `liquid`)
	htmlTemplateEngine: "njk",

	// These are all optional:
	dir: {
		input: "content",          // default: "."
		includes: "../_includes",  // default: "_includes" (`input` relative)
		data: "../_data",          // default: "_data" (`input` relative)
		output: "_site"
	},

	// -----------------------------------------------------------------
	// Optional items:
	// -----------------------------------------------------------------

	// If your site deploys to a subdirectory, change `pathPrefix`.
	// Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

	// When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
	// it will transform any absolute URLs in your HTML to include this
	// folder name and does **not** affect where things go in the output folder.

	// pathPrefix: "/",
};
