# AWS management console colorize

Chrome and Firefox extensions to change and add colors in the AWS management console.  
Those extensions offer the following features:

- Change the header and footer colors of the AWS management console.
- Add color blocks to the AWS session selection page.

These allow you to differentiate between multiple session ARNs.  
These are inspired by [gcp-console-colorize](https://github.com/yfuruyama/gcp-console-colorize).

![A screenshot in the AWS management console](screenshots/management_console.png)
![A screenshot in the AWS session selection page](screenshots/session_selection_page.png)

## Download

- Chrome: <https://chromewebstore.google.com/detail/aws-management-console-co/ihllnndjleheembkonidbocncnnedhcf>
- Firefox: <https://addons.mozilla.org/ja/firefox/addon/aws-console-colorize/>

## Permission justification

### `storage` justification

Those extensions save the colors of the AWS pages per session ARN to storage.

### `tabs` justification

The popup for those extensions sends messages to the content script running on the active tab to:

- To get the session ARN used by the AWS pages.
- If you change the settings in the popup, the settings will be reflected in the AWS pages.

### Host permission justification

<!-- textlint-disable ja-technical-writing/sentence-length -->

The content script for those extensions is intended to work with the AWS management console and session selection page.  
Therefore, the `content_scripts.matches` field is set to run only in the AWS management console and sign-in pages including session selection page.

<!-- textlint-enable ja-technical-writing/sentence-length -->

## Development

### Settings

You can install `pre-commit` by following the instructions at <https://pre-commit.com/>.  
`pre-commit` ensures that your credentials are not included in your commit at commit time.

### Install packages

1. Install `bun` according to [`bun` official site](https://bun.sh/docs/installation)
2. Install packages using the following command:
   ```Shell
   bun install --ignore-scripts
   ```

### Build for production and ZIP output

The ZIP will be output in the `dist` directory.

```shell
# For Chrome extension
bun run zip:chrome

# For Firefox extension
bun run zip:firefox
```
