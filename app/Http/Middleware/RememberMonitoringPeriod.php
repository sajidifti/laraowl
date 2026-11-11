<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps the selected time window across pages whose links do not carry it.
 *
 * A period in the query string is remembered in the session; a request
 * without one gets the remembered window merged back into its query, so
 * every `$request->query('period')` reader sees the user's selection.
 */
class RememberMonitoringPeriod
{
    public const PERIODS = ['1h', '24h', '7d', '14d', '30d', 'custom'];

    private const SESSION_KEY = 'monitoring_period';

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $period = $request->query('period');

        if (in_array($period, self::PERIODS, true)) {
            $request->session()->put(self::SESSION_KEY, array_filter([
                'period' => $period,
                'from' => $period === 'custom' ? $request->query('from') : null,
                'to' => $period === 'custom' ? $request->query('to') : null,
            ]));
        } elseif ($period === null && $remembered = $request->session()->get(self::SESSION_KEY)) {
            $request->query->add($remembered);
        }

        return $next($request);
    }
}
