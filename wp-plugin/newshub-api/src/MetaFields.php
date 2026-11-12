<?php

declare(strict_types=1);

namespace NewsHub\Api;

final class MetaFields
{
    public function register(): void
    {
        register_post_meta('post', 'subtitle', [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback' => self::can_edit_post(...),
        ]);

        register_post_meta('post', 'reading_time', [
            'type' => 'integer',
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => static fn (mixed $value): int => max(0, absint($value)),
            'auth_callback' => self::can_edit_post(...),
        ]);

        register_post_meta('post', 'source_system', [
            'type' => 'string',
            'single' => true,
            'show_in_rest' => [
                'schema' => [
                    'type' => 'string',
                    'enum' => ['wordpress', 'cue'],
                    'default' => 'wordpress',
                ],
            ],
            'sanitize_callback' => static function (mixed $value): string {
                $source = sanitize_key((string) $value);

                return in_array($source, ['wordpress', 'cue'], true) ? $source : 'wordpress';
            },
            'auth_callback' => self::can_edit_post(...),
        ]);
    }

    private static function can_edit_post(bool $allowed, string $metaKey, int $postId): bool
    {
        return current_user_can('edit_post', $postId);
    }
}
