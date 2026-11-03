# Website Crawler

Crawls a website and saves the main content of each page as a Markdown file.

It is set up for the Oscar Wylee New Zealand site (https://www.oscarwylee.co.nz) as part of the `ow-nz-chatbot` project. Its content rules are written for that site's Magento page structure. See [Using it on another site](#using-it-on-another-site) to point it somewhere else.

## How it works

1. Reads settings from `config/crawler-config.json`.
2. Builds a list of URLs from the sitemap, following a sitemap index into its child sitemaps. With the sitemap turned off, it starts at `startUrl` and follows links instead.
3. Fetches the pages one at a time, up to `maxPages`.
4. For each page, takes the `#maincontent` element, removes UI elements, converts the HTML to Markdown and writes it to the output folder.

## Requirements

- Node.js 18.17 or later (required by cheerio 1.0)
- npm

## Installation

```bash
npm install
```

## Usage

### 1. Configure

```bash
npm run setup
```

The setup wizard asks for each setting in the [Configuration](#configuration) table and saves your answers to `config/crawler-config.json`. Press Enter to accept a default. Running the wizard **replaces** the existing config file. To change one setting, edit the file directly instead.

### 2. Crawl

```bash
npm start
```

This is the same as `node website-crawler.js`. The console shows each URL as it is crawled (`Crawling:`), each file written (`Saved:`) and any errors. It finishes with `Crawl complete! Processed N pages.`

> **Before a fresh crawl, clear or move the `output/` folder.** The crawler does not empty it, so files from earlier runs stay alongside the new ones.

## Configuration

Settings live in `config/crawler-config.json`. Any value in that file overrides the built-in default in `website-crawler.js`. If the file is missing, the built-in defaults are used, and they point at the placeholder `https://example.com`.

| Key | Wizard default | Description |
| --- | --- | --- |
| `startUrl` | required | Base URL of the site. When following links, only URLs that start with this value are queued. |
| `useSitemap` | `false` | Queue every URL in the sitemap before crawling. |
| `sitemapUrl` | none | URL of the sitemap or sitemap index. Only asked for when `useSitemap` is `true`. |
| `strictSitemapOnly` | `false` | With `useSitemap` on, crawl only the sitemap URLs and do not follow links found in pages. |
| `outputDir` | `./output` | Folder for the Markdown files. Created if missing. Relative paths are resolved from the folder you run the command in. |
| `maxPages` | `100` | Maximum number of URLs to fetch. |
| `ignoreParams` | `true` | Drop query strings from links found in pages, so `page.html?color=red` and `page.html` count as one page. |
| `skipImages` | `false` | Remove images. When `false`, images are written as `![alt](url)`. |
| `addSourceUrl` | `true` | Add `# Source: <page URL>` as the first line of each file. |
| `cleanOutput` | `true` | Remove leading whitespace from each line and collapse runs of blank lines. |

The current configuration crawls every page in the NZ sitemap and nothing else:

```json
{
  "startUrl": "https://www.oscarwylee.co.nz/",
  "sitemapUrl": "https://www.oscarwylee.co.nz/sitemapnz.xml",
  "outputDir": "./output",
  "maxPages": 1000,
  "ignoreParams": true,
  "useSitemap": true,
  "skipImages": true,
  "addSourceUrl": true,
  "cleanOutput": true,
  "strictSitemapOnly": true
}
```

## Output

- One `.md` file per page that has a `#maincontent` element. Pages without one are skipped and logged as `No #maincontent found on the page`.
- The filename is the page's `<title>`, with spaces replaced by hyphens and characters that aren't allowed in filenames removed. For example, `Aries Optical Glasses - Shop Eyeglasses Online - Oscar Wylee` becomes `Aries-Optical-Glasses---Shop-Eyeglasses-Online---Oscar-Wylee.md`.

Example output (trimmed):

```markdown
# Source: https://www.oscarwylee.co.nz/aries-optical.html

# Aries
## Frame Design of Aries Glasses
The frame design of Oscar Wylee's Aries glasses is characterised by their oval and round shape...
## About Aries Frames
| Frame fit | Measurements |
| --- | --- |
| MEDIUM | 53 - 21 - 145 |
```

## Content cleanup rules

These rules run in `convertToMarkdown()` in `website-crawler.js`, before the HTML is converted to Markdown.

| Rule | Applies to | Effect |
| --- | --- | --- |
| Main content only | All pages | Everything outside `#maincontent` (header, navigation, footer) is ignored. |
| Scripts and styles | All pages | `<script>` and `<style>` tags are removed. |
| Sort and filter bar | All pages | `.toolbar-sorter.sorter`, `.filter-options` and `#layered-filter-block` are removed. |
| Prescription selector | Product pages: URLs ending in `-optical.html` or `-sunglasses.html` | `.field.prescription.required.prescription-tabs` and `.action-skip-wrapper` are removed. |
| JavaScript links | All pages | Links such as `javascript:void(0)` are kept as plain text, not Markdown links. |
| Cloudflare email placeholders | All pages | `[email protected]` text inserted by Cloudflare's email protection is removed. |

The remaining HTML is then converted: headings become `#` headings, links become `[text](absolute URL)`, lists become `*` or `1.` items, tables become Markdown tables and blockquotes become `>` lines. Any other tags are stripped and only their text is kept.

## Using it on another site

The cleanup rules are tied to Oscar Wylee's Magento markup. To crawl a different site:

1. In `website-crawler.js`, change the `#maincontent` selector in both `extractLinks()` and `convertToMarkdown()` to the element that holds the main content on the new site.
2. Remove or replace the Oscar Wylee-specific rules (the sort and filter bar, and the prescription selector).
3. Run `npm run setup` with the new site's URL and sitemap.

## Project structure

```
website-crawler.js          Crawler and HTML-to-Markdown conversion (npm start)
website-crawler-cli.js      Interactive setup wizard (npm run setup)
config/crawler-config.json  Crawler settings
output/                     Generated Markdown files
output.zip                  Archived copy of an earlier crawl's output
website-crawler.js.backup   Earlier version of the crawler, before the Oscar Wylee cleanup rules were added
```

## Known limitations

- **No JavaScript rendering.** Pages are fetched as raw HTML. Content that the browser fills in with scripts is missing or shows template placeholders, such as `Only %1 left` on product pages.
- **`maxPages` counts every URL attempted**, including failed requests and pages with no `#maincontent`. It can be reached with fewer files saved than the limit.
- **Pages with the same `<title>` overwrite each other**, because the filename comes from the title.
- **Link following is narrow.** When it is used, only links inside `#maincontent` that start with `startUrl` are followed, and links containing a `#fragment` are skipped.
- **No rate limiting or robots.txt check.** Requests are sent one after another with no delay between them.
