# Square Tab

> A minimalistic but functional new tab page inspired by Mac Square's
> [Splash Tab][1].

*Supports Chrome >= 49 (the first version with css variable support).*

## Developing
Go to [chrome://extensions](chrome://extensions).  Ensure you are in developer
mode, then click `Load Unpacked Extension` and select the root folder of this
project.

## Linting
First run `yarn install` or `npm install` to download eslint.  Then run
`yarn lint` or `npm run lint` to check for errors in your code.  To fix some
of the errors, such as whitespace problems, run `yarn fix` or `npm run fix`.

## Deploying
Run `yarn zip` or `npm run zip` to create/update the zip file.  Deploy from the
chrome web store developers console, and upload `square-tab.zip`.

  [1]: https://chrome.google.com/webstore/detail/splash-tab/ggljjfbnnofkajgcnleiglffhhbbommh
