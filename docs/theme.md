# Theme Tokens

The web client uses a midnight violet theme defined in `src/index.css` with
Tailwind `@theme` colour tokens. These tokens are app-local presentation values
for the experimental prototype and are not a standalone design system or UI kit.

## Core Palette

| Token | Hex | Use |
| --- | --- | --- |
| `proofline-bg` | `#1A0C2E` | Main page background |
| `proofline-bg-deep` | `#10051F` | App edges and deep shadows |
| `proofline-surface` | `#25143F` | Cards and panels |
| `proofline-surface-elevated` | `#321C55` | Raised cards, inputs, table headers |
| `proofline-surface-strong` | `#44286F` | Active navigation and selected surfaces |
| `proofline-border` | `#5B3B89` | Card, table, and input borders |
| `proofline-border-strong` | `#7C5BC4` | Active borders and emphasized dividers |
| `proofline-text` | `#F8F4FF` | Primary text |
| `proofline-text-secondary` | `#E5D8FF` | Body copy and secondary metadata |
| `proofline-text-muted` | `#C9B8EA` | Help text, labels, and low-emphasis metadata |
| `proofline-text-disabled` | `#8E78B3` | Disabled text and placeholders |

## Action Palette

| Token | Hex | Use |
| --- | --- | --- |
| `proofline-primary` | `#A78BFA` | Primary buttons and primary active states |
| `proofline-primary-hover` | `#C4B5FD` | Primary button hover |
| `proofline-primary-active` | `#8B5CF6` | Primary button pressed state |
| `proofline-primary-text` | `#12071F` | Text on primary lavender |
| `proofline-accent-cyan` | `#22D3EE` | Links and secondary highlights |
| `proofline-accent-magenta` | `#E879F9` | Rare emphasis |
| `proofline-focus` | `#C084FC` | Keyboard focus rings |

## Semantic Palette

| Token | Hex | Use |
| --- | --- | --- |
| `proofline-success` | `#34D399` | Success state text and badge borders |
| `proofline-success-bg` | `#052E24` | Success badge or alert background |
| `proofline-warning` | `#FBBF24` | Warning state text and badge borders |
| `proofline-warning-bg` | `#3A2603` | Warning alert and prototype notice background |
| `proofline-danger` | `#FB7185` | Error state text and badge borders |
| `proofline-danger-bg` | `#3F0B16` | Error alert background |
| `proofline-info` | `#38BDF8` | Informational state text and badge borders |
| `proofline-info-bg` | `#082F49` | Informational alert background |

## Usage

Use these tokens through Tailwind utilities such as `bg-proofline-surface`,
`text-proofline-text`, `border-proofline-border`, and
`focus:outline-proofline-focus`. Keep status UI text-labeled so success,
warning, danger, and info states are not color-only. Preserve the prototype
warning and emergency-reliance language whenever visual surfaces are changed.
