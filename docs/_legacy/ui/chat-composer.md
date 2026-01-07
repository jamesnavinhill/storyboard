# Chat Composer

The chat input and footer icons are now unified into a single "composer" structure with a subtle, polished pink glow.

- Container class: `composer brand-glow-clean`
- Internal layout:
  - Top: textarea (`composer-input`), grows with content
  - Divider: `composer-divider` (thin, neutral line)
  - Bottom: icon row (`composer-bottom`) with attachments, presets, settings, mic (disabled), and send

Design goals:
- One continuous, minimal-spread glow using brand pink tokens
- No harsh lines; divider is subtle and inset
- Keyboard: Cmd/Ctrl+Enter submits
- Focus within the composer strengthens the glow for clarity

Implementation reference: `src/components/ChatPanel.tsx` and styles in `src/styles/utilities.css`.
