<?php

namespace App\Services;

/**
 * Guzzle options that let uptime checks reach locally hosted `*.localhost` sites.
 *
 * Inside a container, curl answers every `*.localhost` name with loopback, so
 * those checks would hit the container itself. When a local address is
 * configured, the request keeps its hostname (for virtual hosts and TLS) but
 * connects to that address instead.
 */
class UptimeRequestOptions
{
    /**
     * @return array<string, mixed>
     */
    public function for(string $url): array
    {
        $options = [];
        $caBundle = config('laraowl.uptime.ca_bundle');

        if ($caBundle) {
            $options['verify'] = $caBundle;
        }

        $address = $this->localAddress();
        $parts = parse_url($url);
        $host = strtolower($parts['host'] ?? '');

        if ($address && ($host === 'localhost' || str_ends_with($host, '.localhost'))) {
            $port = $parts['port'] ?? (($parts['scheme'] ?? 'http') === 'https' ? 443 : 80);
            $options['curl'] = [CURLOPT_RESOLVE => ["{$host}:{$port}:{$address}"]];
        }

        return $options;
    }

    /**
     * The configured address, with a hostname resolved to its IP.
     */
    protected function localAddress(): ?string
    {
        $address = config('laraowl.uptime.localhost_address');

        if (! $address) {
            return null;
        }

        return filter_var($address, FILTER_VALIDATE_IP) ? $address : gethostbyname($address);
    }
}
