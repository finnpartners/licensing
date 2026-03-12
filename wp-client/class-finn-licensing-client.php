<?php
/**
 * FINN Licensing Client
 *
 * Drop-in PHP class for WordPress plugins to connect to a FINN Licensing server.
 * Handles license validation, automatic update checks, and licensed downloads.
 *
 * @package FINN_Licensing
 * @version 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'Finn_Licensing_Client' ) ) {

	class Finn_Licensing_Client {

		private string $server_url;
		private string $product_id;
		private string $product_slug;
		private string $product_name;
		private string $version;
		private string $license_key;
		private string $plugin_file;
		private string $plugin_basename;

		/**
		 * Initialize the licensing client.
		 *
		 * @param array $args {
		 *     @type string $server_url    Base URL of the FINN Licensing server (no trailing slash).
		 *     @type string $product_id    Numeric product ID from the licensing server.
		 *     @type string $product_slug  Plugin slug (matches the product slug on the server).
		 *     @type string $product_name  Human-readable plugin name.
		 *     @type string $version       Current installed version of the plugin.
		 *     @type string $license_key   The license key UUID.
		 *     @type string $plugin_file   The main plugin file path (__FILE__ from the plugin).
		 * }
		 */
		public function __construct( array $args ) {
			$this->server_url      = untrailingslashit( $args['server_url'] ?? '' );
			$this->product_id      = $args['product_id'] ?? '';
			$this->product_slug    = $args['product_slug'] ?? '';
			$this->product_name    = $args['product_name'] ?? '';
			$this->version         = $args['version'] ?? '0.0.0';
			$this->license_key     = $args['license_key'] ?? '';
			$this->plugin_file     = $args['plugin_file'] ?? '';
			$this->plugin_basename = plugin_basename( $this->plugin_file );

			if ( empty( $this->server_url ) || empty( $this->product_id ) ) {
				return;
			}

			add_filter( 'pre_set_site_transient_update_plugins', [ $this, 'check_for_update' ] );
			add_filter( 'plugins_api', [ $this, 'plugin_info' ], 10, 3 );
			add_action( 'in_plugin_update_message-' . $this->plugin_basename, [ $this, 'update_message' ], 10, 2 );
		}

		/**
		 * Get the site's domain fingerprint for license validation.
		 *
		 * @return string
		 */
		private function get_fingerprint(): string {
			$site_url = get_site_url();
			$parsed   = wp_parse_url( $site_url );
			$host     = $parsed['host'] ?? $site_url;

			$host = preg_replace( '/^www\./', '', $host );

			return strtolower( $host );
		}

		/**
		 * Validate the license key against the server.
		 *
		 * @return bool True if the license is valid for this domain.
		 */
		public function validate_license(): bool {
			if ( empty( $this->license_key ) ) {
				return false;
			}

			$response = wp_remote_post(
				$this->server_url . '/api/validate',
				[
					'timeout' => 15,
					'headers' => [ 'Content-Type' => 'application/json' ],
					'body'    => wp_json_encode( [
						'key'         => $this->license_key,
						'fingerprint' => $this->get_fingerprint(),
					] ),
				]
			);

			if ( is_wp_error( $response ) ) {
				return false;
			}

			$body = json_decode( wp_remote_retrieve_body( $response ), true );

			return ! empty( $body['data']['valid'] );
		}

		/**
		 * Check the licensing server for available updates.
		 *
		 * Hooked to `pre_set_site_transient_update_plugins`.
		 *
		 * @param object $transient The update_plugins transient data.
		 * @return object Modified transient data.
		 */
		public function check_for_update( $transient ) {
			if ( empty( $transient->checked ) ) {
				return $transient;
			}

			if ( empty( $this->license_key ) ) {
				return $transient;
			}

			$remote = $this->fetch_update_data();

			if ( $remote === false || empty( $remote['version'] ) ) {
				return $transient;
			}

			if ( version_compare( $this->version, $remote['version'], '<' ) ) {
				$update = (object) [
					'slug'         => $this->product_slug,
					'plugin'       => $this->plugin_basename,
					'new_version'  => $remote['version'],
					'package'      => $remote['download_url'] ?? '',
					'url'          => '',
					'tested'       => $remote['tested'] ?? '',
					'requires'     => $remote['requires'] ?? '',
					'requires_php' => $remote['requires_php'] ?? '',
				];

				$transient->response[ $this->plugin_basename ] = $update;
			} else {
				$no_update = (object) [
					'slug'        => $this->product_slug,
					'plugin'      => $this->plugin_basename,
					'new_version' => $this->version,
					'url'         => '',
				];

				$transient->no_update[ $this->plugin_basename ] = $no_update;
			}

			return $transient;
		}

		/**
		 * Provide plugin information for the WordPress plugin details modal.
		 *
		 * Hooked to `plugins_api`.
		 *
		 * @param false|object|array $result The result object or array.
		 * @param string             $action The API action being performed.
		 * @param object             $args   Plugin API arguments.
		 * @return false|object
		 */
		public function plugin_info( $result, $action, $args ) {
			if ( $action !== 'plugin_information' ) {
				return $result;
			}

			if ( ! isset( $args->slug ) || $args->slug !== $this->product_slug ) {
				return $result;
			}

			$remote = $this->fetch_update_data();

			if ( $remote === false || empty( $remote['version'] ) ) {
				return $result;
			}

			$info = (object) [
				'name'          => $this->product_name,
				'slug'          => $this->product_slug,
				'version'       => $remote['version'],
				'tested'        => $remote['tested'] ?? '',
				'requires'      => $remote['requires'] ?? '',
				'requires_php'  => $remote['requires_php'] ?? '',
				'download_link' => $remote['download_url'] ?? '',
				'trunk'         => $remote['download_url'] ?? '',
				'sections'      => [
					'changelog' => $remote['sections']['changelog'] ?? '',
				],
			];

			return $info;
		}

		/**
		 * Show a message on the plugins page when an update is available.
		 *
		 * @param array  $plugin_data Plugin data from the header.
		 * @param object $response    Update response data.
		 */
		public function update_message( $plugin_data, $response ): void {
			if ( empty( $this->license_key ) ) {
				echo ' <strong>' . esc_html__( 'A valid license key is required to receive updates.' ) . '</strong>';
			}
		}

		/**
		 * Fetch update data from the licensing server.
		 *
		 * Results are cached in a transient for 6 hours.
		 *
		 * @return array|false Update data or false on failure.
		 */
		private function fetch_update_data() {
			$cache_key = 'finn_update_' . md5( $this->product_id . $this->license_key );
			$cached    = get_transient( $cache_key );

			if ( $cached !== false ) {
				return $cached;
			}

			$url = add_query_arg(
				[
					'product_id'  => $this->product_id,
					'license'     => $this->license_key,
					'fingerprint' => $this->get_fingerprint(),
				],
				$this->server_url . '/api/update-check'
			);

			$response = wp_remote_get( $url, [ 'timeout' => 15 ] );

			if ( is_wp_error( $response ) ) {
				return false;
			}

			$code = wp_remote_retrieve_response_code( $response );
			if ( $code !== 200 ) {
				return false;
			}

			$body = json_decode( wp_remote_retrieve_body( $response ), true );

			if ( ! is_array( $body ) || empty( $body['version'] ) ) {
				set_transient( $cache_key, [ 'version' => null ], 2 * HOUR_IN_SECONDS );
				return false;
			}

			set_transient( $cache_key, $body, 6 * HOUR_IN_SECONDS );

			return $body;
		}

		/**
		 * Clear the cached update data.
		 *
		 * Call this when the license key changes or the user manually checks for updates.
		 */
		public function clear_update_cache(): void {
			$cache_key = 'finn_update_' . md5( $this->product_id . $this->license_key );
			delete_transient( $cache_key );
		}
	}
}
