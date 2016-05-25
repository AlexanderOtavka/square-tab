# Square Tab

> A minimalistic but functional new tab page inspired by Mac Square's
[Splash Tab](https://chrome.google.com/webstore/detail/splash-tab/ggljjfbnnofkajgcnleiglffhhbbommh?hl=en).

*Supports Chrome >= 36.*

## Setup
Run `npm install` to pull in dependencies.  Install gulp if necessary with `npm
install -g gulp`.  Run `gulp` to build to `dist/` for production, or `gulp
watch` to build to `dev/` and automatically rebuild when files are changed.
Run `gulp pack` to make a zip file suitable for upload to the chrome web store.

Eventually, for backwards compatibility, use:
- babel (for es6, but also with closures)
- babel polyfill
- possibly webcomponents polyfill
