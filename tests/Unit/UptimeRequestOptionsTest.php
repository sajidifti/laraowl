<?php

use App\Services\UptimeRequestOptions;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    config(['laraowl.uptime' => ['localhost_address' => null, 'ca_bundle' => null]]);
});

test('it adds no options when nothing is configured', function () {
    expect((new UptimeRequestOptions)->for('https://app.localhost/up'))->toBe([]);
});

test('it routes localhost sites to the configured address on the right port', function (string $url, string $resolve) {
    config(['laraowl.uptime.localhost_address' => '10.0.0.1']);

    expect((new UptimeRequestOptions)->for($url))
        ->toBe(['curl' => [CURLOPT_RESOLVE => [$resolve]]]);
})->with([
    'https' => ['https://Shop.localhost/up', 'shop.localhost:443:10.0.0.1'],
    'http' => ['http://shop.localhost', 'shop.localhost:80:10.0.0.1'],
    'explicit port' => ['https://api.shop.localhost:8443/up', 'api.shop.localhost:8443:10.0.0.1'],
]);

test('it leaves public sites alone but still applies the CA bundle', function () {
    config([
        'laraowl.uptime.localhost_address' => '10.0.0.1',
        'laraowl.uptime.ca_bundle' => '/certs/local-ca.pem',
    ]);

    expect((new UptimeRequestOptions)->for('https://example.com/up'))
        ->toBe(['verify' => '/certs/local-ca.pem']);
});
