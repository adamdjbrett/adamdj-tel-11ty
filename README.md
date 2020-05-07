# Adam DJ Brett Contact Information
[adamdj.tel](https://www.adamdj.tel)

[![Build Status](https://travis-ci.org/adamdjbrett/adamdj-tel-11ty.svg?branch=master)](https://travis-ci.org/adamdjbrett/adamdj-tel-11ty)

⚠️ WARNING: This is an Educational Project, not ready for production!⚠️

## FAQ
### Q:  What is this?
#### A: Frankenstein's monster
I took the Front Cover Jekyll theme and imported it into eleventy as a liquid template. After getting Front Cover to work as a liquid template in eleventy I converted it to Nunjucks.

### Q: Why?
#### A: To see if I could.

### Q: Can I use this?
#### A: Yes you can _can_ but you really should  not.
Use a real [starter project](https://www.11ty.dev/docs/starter/) or a [beautiful theme](https://jamstackthemes.dev/)

## Scaffold
	- [Eleventy](https://11ty.dev)
	- [Eleventy base blog ](https://github.com/11ty/eleventy-base-blog)
	- [Front Cover Jekyll Theme](https://github.com/dashingcode/front-cover) & [@epidrome cover-card theme fork](https://github.com/epidrome/cover-card)
		- Updated to use Font-Awesome 4.7.0
		- [Load CSS asynchronously](https://github.com/filamentgroup/loadCSS/)
- Added `404.html` page and using [html5boilerplate.com](https://html5boilerplate.com/)
- Added `robots.txt` using `robots.njk`
- Built on github pages using [travis-ci](travis-ci.org)

---
Below is the the README for eleventy base blog the theme you should actually use.
# eleventy-base-blog

A starter repository showing how to build a blog with the [Eleventy](https://github.com/11ty/eleventy) static site generator.


## Demos

* [Netlify](https://eleventy-base-blog.netlify.com/)
* [GitHub Pages](https://11ty.github.io/eleventy-base-blog/)

## Deploy this to your own site

These builders are amazing—try them out to get your own Eleventy site in a few clicks!

* [Get your own Eleventy web site on Netlify](https://app.netlify.com/start/deploy?repository=https://github.com/11ty/eleventy-base-blog)
* [Get your own Eleventy web site on ZEIT Now](https://zeit.co/new/project?template=11ty/eleventy-base-blog)

## Getting Started

### 1. Clone this Repository

```
git clone https://github.com/11ty/eleventy-base-blog.git my-blog-name
```


### 2. Navigate to the directory

```
cd my-blog-name
```

Specifically have a look at `.eleventy.js` to see if you want to configure any Eleventy options differently.

### 3. Install dependencies

```
npm install
```

### 4. Edit `_data/metadata.json`

### 5. Run Eleventy

```
npx eleventy
```

Or build and host locally for local development
```
npx eleventy --serve
```

Or build automatically when a template changes:
```
npx eleventy --watch
```

Or in debug mode:
```
DEBUG=* npx eleventy
```

### Implementation Notes

* `about/index.md` shows how to add a content page.
* `posts/` has the blog posts but really they can live in any directory. They need only the `post` tag to be added to this collection.
* Add the `nav` tag to add a template to the top level site navigation. For example, this is in use on `index.njk` and `about/index.md`.
* Content can be any template format (blog posts needn’t be markdown, for example). Configure your supported templates in `.eleventy.js` -> `templateFormats`.
	* Because `css` and `png` are listed in `templateFormats` but are not supported template types, any files with these extensions will be copied without modification to the output (while keeping the same directory structure).
* The blog post feed template is in `feed/feed.njk`. This is also a good example of using a global data files in that it uses `_data/metadata.json`.
* This example uses three layouts:
  * `_includes/layouts/base.njk`: the top level HTML structure
  * `_includes/layouts/home.njk`: the home page template (wrapped into `base.njk`)
  * `_includes/layouts/post.njk`: the blog post template (wrapped into `base.njk`)
* `_includes/postlist.njk` is a Nunjucks include and is a reusable component used to display a list of all the posts. `index.njk` has an example of how to use it.

## License
[LICENSE](LICENSE)

## Credits
[humans.txt](/pages/humans.njk)
