# FINN DEV Dashboard

This plugin provides a central management interface for internal Finn Partners WordPress plugins. It handles automatic updates and site licensing through the FINN Licensing Server.

## 1. Setup (Per Site)

Navigate to **FINN DEV > Settings** in the WordPress admin and enter two keys:

| Field | Description |
|-------|-------------|
| **FINN API Key** | Enables the Dashboard to list all available FINN plugins for one-click installation. Obtain this from your FINN Licensing Server administrator. |
| **Site License Key** | Ties this WordPress site to its license. Required for downloading plugin updates and verifying the domain. Each site has its own unique key, issued from the FINN Licensing Server. |

Click **Save Settings** when done.

> **Note:** The FINN DEV menu is only visible to users logged in with a `@finnpartners.com` email address.

---

## 2. How It Works

### Plugin Detection
Any plugin whose folder name starts with `fp-` is automatically recognized as a FINN plugin. No special headers or configuration are needed in individual plugin files.

For example, a plugin at `wp-content/plugins/fp-rss/fp-rss.php` is detected automatically by its `fp-rss` folder name.

### Automatic Updates
The FINN Licensing Server polls your GitHub repositories for new releases. When a new version is detected:

1. The server records the latest version and download URL.
2. WordPress periodically checks the server for updates (via the standard update cycle).
3. Available updates appear in the FINN DEV Dashboard and the standard WordPress Updates screen.
4. Updates are downloaded through the licensing server, which proxies the file from GitHub — no GitHub credentials are needed on the WordPress site.

### One-Click Installation
When the FINN API Key is configured, the Dashboard lists all available FINN plugins. Plugins that aren't yet installed on the site show an **Install** button for one-click installation.

---

## 3. Publishing a Plugin Update

To release a new version of a FINN plugin:

1. **Bump the version** in your plugin's main PHP file header (e.g., `Version: 1.0.1`).
2. **Commit and push** to the `main` branch.
3. **Create a GitHub Release** with a tag matching the version (e.g., `v1.0.1`).

The licensing server will detect the new release during its next polling cycle and make the update available to all licensed sites.

---

## 4. Licensing

Each WordPress site requires an active license in the FINN Licensing Server tied to its domain.

- **Daily Verification:** The plugin checks license status once per day. If the license is revoked or missing, a warning notice appears in the WordPress admin and plugin updates are disabled.
- **Domain Fingerprinting:** The site's domain is sent with every request to verify it matches the license. The domain is normalized (no `www.`, no trailing slashes).
- **Version Tracking:** Each time a site checks for updates, the current installed version of each plugin is reported back to the licensing server for monitoring.
- **Manual Check:** Append `?finn_force_license_check` to any admin URL to trigger an immediate license verification.

---

## 5. Adding a New Plugin to the System

1. Create a GitHub repository in the `finnpartners` organization with a name starting with `fp-` (e.g., `fp-my-new-plugin`).
2. In the FINN Licensing Server, import the repository from the **Products** page.
3. Create a GitHub Release with a version tag (e.g., `v1.0.0`).
4. The plugin will now appear in the Dashboard on licensed sites and receive automatic updates.

No changes to the plugin code are required — just follow the `fp-` folder naming convention.
