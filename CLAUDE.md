# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code).
It helps when working with code in this repository.

## Project Overview

This is a browser extension for Chrome and Firefox that colorizes the AWS Management Console.
It allows users to assign colors to different AWS session ARNs.
This helps differentiate between multiple accounts and roles.

## Important Patterns

### Async Initialization

Content script uses MutationObserver pattern when target elements aren't immediately available.
This is because AWS console uses dynamic rendering.

## Testing Notes

End-to-end tests (`tests/e2e/`) use Playwright with chromium profile. The dev build allows `file://` protocol for loading local HTML fixtures.
