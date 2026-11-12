<?php
/**
 * Plugin Name: NewsHub API
 * Description: Provides a public REST API for NewsHub articles.
 * Version: 1.0.0
 * Requires PHP: 8.2
 * Text Domain: newshub-api
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

$autoload = __DIR__ . '/vendor/autoload.php';

if (!file_exists($autoload)) {
    add_action('admin_notices', static function (): void {
        echo '<div class="notice notice-error"><p>';
        echo esc_html__('NewsHub API requires Composer dependencies. Run composer install in wp-plugin/newshub-api.', 'newshub-api');
        echo '</p></div>';
    });

    return;
}

require_once $autoload;

\NewsHub\Api\Plugin::boot();
