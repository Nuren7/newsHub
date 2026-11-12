<?php

declare(strict_types=1);

namespace NewsHub\Api;

use WP_Error;
use WP_Post;
use WP_Query;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

final class RestController
{
    public function register(): void
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void
    {
        register_rest_route('newshub/v1', '/articles', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_articles'],
            'permission_callback' => '__return_true',
            'args' => [
                'page' => [
                    'default' => 1,
                    'type' => 'integer',
                    'sanitize_callback' => static fn (mixed $value): int => absint($value),
                    'validate_callback' => static fn (mixed $value): bool => is_numeric($value) && (int) $value >= 1,
                ],
                'per_page' => [
                    'default' => 10,
                    'type' => 'integer',
                    'sanitize_callback' => static fn (mixed $value): int => absint($value),
                    'validate_callback' => static fn (mixed $value): bool => is_numeric($value)
                        && (int) $value >= 1
                        && (int) $value <= 50,
                ],
                'search' => [
                    'default' => '',
                    'type' => 'string',
                    'sanitize_callback' => static fn (mixed $value): string => sanitize_text_field((string) $value),
                ],
                'category' => [
                    'default' => '',
                    'type' => 'string',
                    'sanitize_callback' => static fn (mixed $value): string => sanitize_title((string) $value),
                ],
            ],
        ]);

        register_rest_route('newshub/v1', '/articles/(?P<slug>[a-zA-Z0-9-]+)', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_article'],
            'permission_callback' => '__return_true',
            'args' => [
                'slug' => [
                    'required' => true,
                    'sanitize_callback' => static fn (mixed $value): string => sanitize_title((string) $value),
                ],
            ],
        ]);
    }

    public function get_articles(WP_REST_Request $request): WP_REST_Response
    {
        $queryArgs = [
            'post_type' => 'post',
            'post_status' => 'publish',
            'posts_per_page' => (int) $request->get_param('per_page'),
            'paged' => (int) $request->get_param('page'),
            'ignore_sticky_posts' => true,
            'orderby' => 'date',
            'order' => 'DESC',
        ];

        $search = (string) $request->get_param('search');
        $category = (string) $request->get_param('category');

        if ($search !== '') {
            $queryArgs['s'] = $search;
        }

        if ($category !== '') {
            $queryArgs['category_name'] = $category;
        }

        $query = new WP_Query($queryArgs);
        $articles = array_map(
            fn (WP_Post $post): array => $this->serialize_article($post),
            $query->posts
        );
        $response = new WP_REST_Response($articles);
        $response->header('X-WP-Total', (string) $query->found_posts);
        $response->header('X-WP-TotalPages', (string) $query->max_num_pages);

        return $response;
    }

    public function get_article(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $query = new WP_Query([
            'post_type' => 'post',
            'post_status' => 'publish',
            'name' => (string) $request->get_param('slug'),
            'posts_per_page' => 1,
        ]);
        $post = $query->posts[0] ?? null;

        if (!$post instanceof WP_Post) {
            return new WP_Error(
                'newshub_article_not_found',
                __('Article not found.', 'newshub-api'),
                ['status' => 404]
            );
        }

        return new WP_REST_Response($this->serialize_article($post));
    }

    private function serialize_article(WP_Post $post): array
    {
        $categories = get_the_terms($post, 'category');
        $categoryData = [];

        if (is_array($categories)) {
            foreach ($categories as $category) {
                $categoryData[] = [
                    'id' => (int) $category->term_id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ];
            }
        }

        $sourceSystem = get_post_meta($post->ID, 'source_system', true);

        return [
            'id' => $post->ID,
            'slug' => $post->post_name,
            'title' => get_the_title($post),
            'subtitle' => (string) get_post_meta($post->ID, 'subtitle', true),
            'excerpt' => get_the_excerpt($post),
            'content' => apply_filters('the_content', $post->post_content),
            'date' => get_post_time(DATE_ATOM, true, $post),
            'link' => get_permalink($post),
            'featured_image' => get_the_post_thumbnail_url($post, 'full') ?: null,
            'categories' => $categoryData,
            'reading_time' => (int) get_post_meta($post->ID, 'reading_time', true),
            'source_system' => $sourceSystem !== '' ? $sourceSystem : 'wordpress',
        ];
    }
}
