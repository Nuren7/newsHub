<?php

declare(strict_types=1);

namespace NewsHub\Api;

use WP_Post;

final class RevalidationWebhook
{
    public function register(): void
    {
        add_action('save_post', [$this, 'on_save_post'], 10, 3);
    }

    public function on_save_post(int $postId, WP_Post $post, bool $update): void
    {
        if ($post->post_type !== 'post' || wp_is_post_revision($postId) || wp_is_post_autosave($postId)) {
            return;
        }

        $url = trim((string) getenv('NEWSHUB_REVALIDATION_URL'));

        if ($url === '') {
            return;
        }

        $secret = trim((string) getenv('NEWSHUB_REVALIDATION_SECRET'));

        if ($secret === '') {
            error_log('[NewsHub API] Revalidation URL is configured without NEWSHUB_REVALIDATION_SECRET.');

            return;
        }

        $urlParts = wp_parse_url($url);

        if (!is_array($urlParts) || !in_array($urlParts['scheme'] ?? '', ['http', 'https'], true) || empty($urlParts['host'])) {
            error_log('[NewsHub API] NEWSHUB_REVALIDATION_URL must be an absolute HTTP(S) URL.');

            return;
        }

        $response = wp_remote_post($url, [
            'blocking' => false,
            'timeout' => 2,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-NewsHub-Revalidation-Secret' => $secret,
            ],
            'body' => wp_json_encode([
                'post_id' => $postId,
                'slug' => $post->post_name,
                'status' => $post->post_status,
            ]),
        ]);

        if (is_wp_error($response)) {
            error_log('[NewsHub API] Revalidation webhook request failed: ' . $response->get_error_message());
        }
    }
}
