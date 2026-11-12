<?php

declare(strict_types=1);

namespace NewsHub\Api;

final class Plugin
{
    public static function boot(): void
    {
        (new MetaFields())->register();
        (new RestController())->register();
        (new RevalidationWebhook())->register();
    }
}
