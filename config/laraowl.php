<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Repository
    |--------------------------------------------------------------------------
    |
    | The GitHub repository new releases are checked against. Forks that cut
    | their own releases should point this at their own repository.
    |
    */

    'repository' => env('LARAOWL_REPOSITORY', 'laraowl/laraowl'),

    /*
    |--------------------------------------------------------------------------
    | Update Checks
    |--------------------------------------------------------------------------
    |
    | LaraOwl periodically asks the GitHub releases API whether a newer version
    | has been published, and shows a banner to team owners when there is one.
    | Disable this to stop the instance from making outbound requests.
    |
    */

    'update_check' => [
        'enabled' => env('LARAOWL_UPDATE_CHECK', true),
        'cache_ttl' => (int) env('LARAOWL_UPDATE_CHECK_TTL', 21600),
        'timeout' => (int) env('LARAOWL_UPDATE_CHECK_TIMEOUT', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Update Binaries
    |--------------------------------------------------------------------------
    |
    | Executables the `laraowl:update` command shells out to. Override these
    | when they are not resolvable on the PATH of the user running the update,
    | for example "/usr/local/bin/composer".
    |
    */

    'binaries' => [
        'git' => env('LARAOWL_GIT_BINARY', 'git'),
        'composer' => env('LARAOWL_COMPOSER_BINARY', 'composer'),
        'npm' => env('LARAOWL_NPM_BINARY', 'npm'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Uptime Checks
    |--------------------------------------------------------------------------
    |
    | For local development, where monitored apps run on `*.localhost` sites
    | outside the container. `localhost_address` is where those sites are
    | reachable from here (an IP or a hostname such as host.docker.internal),
    | and `ca_bundle` is a CA file to trust for their certificates.
    |
    */

    'uptime' => [
        'localhost_address' => env('UPTIME_LOCALHOST_ADDRESS'),
        'ca_bundle' => env('UPTIME_CA_BUNDLE'),
    ],

];
