<?php

namespace App\Http\Controllers\Projects;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Record;
use App\Models\Team;
use App\Services\RecordService;
use App\Support\ExceptionTrace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class RecordController extends Controller
{
    /**
     * Record types that start a trace; every other record is an event inside one.
     */
    private const EXECUTION_TYPES = ['request', 'command', 'scheduled-task', 'job-attempt'];

    protected RecordService $recordService;

    public function __construct(RecordService $recordService)
    {
        $this->recordService = $recordService;
    }

    /**
     * Unified Entry Point for Monitoring Dashboards.
     */
    public function index(Request $request, Team $current_team, Project $project): Response
    {
        $routeName = $request->route()->getName();
        $period = $request->query('period', '1h');
        $from = $request->query('from');
        $to = $request->query('to');

        if ($routeName === 'dashboard') {
            return $this->renderDashboardIndex($project, $period, $from, $to);
        }

        $method = 'render'.Str::studly(str_replace('-', '_', $routeName)).'Index';

        if (method_exists($this, $method)) {
            return $this->{$method}($project, $period, $from, $to);
        }

        // Fallback for generic record lists (Logs, Cache, etc.)
        $type = $this->resolveTypeFromRoute($routeName);

        return Inertia::render($this->resolveComponentPath($routeName), [
            'records' => $this->recordService->getPaginatedRecords($project, $type, $this->search(), $period, $from, $to),
            'filters' => $request->only(['search', 'period', 'from', 'to']),
            'stats' => $this->recordService->getQuickStats($project, $period, $from, $to),
            'period' => $period,
            'from' => $from,
            'to' => $to,
        ]);
    }

    /**
     * Specialized Domain Renderers
     */
    protected function renderDashboardIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('dashboard', $this->recordService->getDashboardStats($project, $period, $from, $to), $project, $period, $from, $to);
    }

    protected function renderRequestsIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        $sort = request()->query('sort', 'total');
        $direction = request()->query('direction', 'desc');

        $view = request()->query('view') === 'routes' ? 'routes' : 'raw';
        $data = $this->recordService->getRequestStats($project, $period, $from, $to, $sort, $direction, $view === 'routes' ? $this->search() : null);

        if ($view === 'raw') {
            $data['requests'] = $this->recordService->getPaginatedRecords($project, 'request', $this->search(), $period, $from, $to, $this->rawFilters(['status', 'method']));
        }

        return $this->renderWithStats('projects/requests', [...$data, 'view' => $view, 'filters' => $this->rawFilters(['status', 'method'])], $project, $period, $from, $to);
    }

    protected function renderUsersIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('projects/users', $this->recordService->getUserStats($project, $period, $from, $to, search: $this->search()), $project, $period, $from, $to);
    }

    protected function renderJobsIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('projects/jobs', $this->recordService->getJobStats($project, $period, $from, $to, search: $this->search()), $project, $period, $from, $to);
    }

    protected function renderExceptionsIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        $view = request()->query('view') === 'grouped' ? 'grouped' : 'raw';
        $data = $this->recordService->getExceptionStats($project, $period, $from, $to, search: $view === 'grouped' ? $this->search() : null);

        if ($view === 'raw') {
            $data['exceptions'] = $this->recordService->getPaginatedRecords($project, 'exception', $this->search(), $period, $from, $to, $this->rawFilters(['handled']));
        }

        return $this->renderWithStats('projects/exceptions', [...$data, 'view' => $view, 'filters' => $this->rawFilters(['handled'])], $project, $period, $from, $to);
    }

    protected function renderCommandsIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        $view = request()->query('view') === 'grouped' ? 'grouped' : 'raw';
        $data = $this->recordService->getCommandStats($project, $period, $from, $to, search: $view === 'grouped' ? $this->search() : null);

        if ($view === 'raw') {
            $data['commands'] = $this->recordService->getPaginatedRecords($project, 'command', $this->search(), $period, $from, $to);
        }

        return $this->renderWithStats('projects/commands', [...$data, 'view' => $view], $project, $period, $from, $to);
    }

    protected function renderQueriesIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        $view = request()->query('view') === 'grouped' ? 'grouped' : 'raw';
        $data = $this->recordService->getQueryStats($project, $period, $from, $to, search: $view === 'grouped' ? $this->search() : null);

        if ($view === 'raw') {
            $data['queries'] = $this->recordService->getPaginatedRecords($project, 'query', $this->search(), $period, $from, $to, $this->rawFilters(['connection']));
        }

        return $this->renderWithStats('projects/queries', [...$data, 'view' => $view, 'filters' => $this->rawFilters(['connection'])], $project, $period, $from, $to);
    }

    protected function renderScheduledTasksIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('projects/scheduled-tasks', $this->recordService->getScheduledTaskStats($project, $period, $from, $to, search: $this->search()), $project, $period, $from, $to);
    }

    protected function renderNotificationsIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('projects/notifications', $this->recordService->getNotificationStats($project, $period, $from, $to, search: $this->search()), $project, $period, $from, $to);
    }

    protected function renderMailIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('projects/mail', $this->recordService->getMailStats($project, $period, $from, $to, search: $this->search()), $project, $period, $from, $to);
    }

    protected function renderOutgoingRequestsIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        $view = in_array(request()->query('view'), ['routes', 'hosts'], true) ? request()->query('view') : 'raw';
        $data = $this->recordService->getOutgoingRequestStats($project, $period, $from, $to, search: $view === 'hosts' ? $this->search() : null);

        $data['records'] = match ($view) {
            'raw' => $this->recordService->getPaginatedRecords($project, 'outgoing-request', $this->search(), $period, $from, $to, $this->rawFilters(['status', 'method'])),
            'routes' => $this->recordService->getOutgoingRouteGroups($project, $period, $from, $to, search: $this->search()),
            'hosts' => $data['hosts'],
        };
        unset($data['hosts']);

        return $this->renderWithStats('projects/outgoing-requests', [...$data, 'view' => $view, 'filters' => $this->rawFilters(['status', 'method'])], $project, $period, $from, $to);
    }

    protected function renderUptimeIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('projects/uptime', $this->recordService->getUptimeStats($project, $period, $from, $to), $project, $period, $from, $to);
    }

    protected function renderSecurityIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('projects/security', $this->recordService->getSecurityStats($project, $period, $from, $to), $project, $period, $from, $to);
    }

    protected function renderCacheIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return $this->renderWithStats('projects/cache', $this->recordService->getCacheStats($project, $period, $from, $to, search: $this->search()), $project, $period, $from, $to);
    }

    protected function renderLogsIndex(Project $project, string $period, ?string $from, ?string $to): Response
    {
        return Inertia::render('projects/logs/index', [
            'records' => $this->recordService->getLogRecords($project, $this->search(), $period, $from, $to, $this->rawFilters(['level'])),
            'filters' => [...request()->only(['search', 'period', 'from', 'to']), ...$this->rawFilters(['level'])],
            'stats' => $this->recordService->getQuickStats($project, $period, $from, $to),
            'period' => $period,
            'from' => $from,
            'to' => $to,
        ]);
    }

    /**
     * Drill-down Detail Handlers (Hashed)
     */
    public function showDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/requests/show');
    }

    public function showJobDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/jobs/show');
    }

    public function showExceptionDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/exceptions/show');
    }

    public function showQueryDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/queries/show');
    }

    public function showCommandDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/commands/show');
    }

    public function showScheduledTaskDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/scheduled-tasks/show');
    }

    public function showNotificationDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/notifications/show');
    }

    public function showMailDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/mail/show');
    }

    public function showOutgoingRequestDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        return $this->renderHistory($project, $hash, 'projects/outgoing-requests/show');
    }

    public function showUserDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        $period = $request->query('period', '1h');
        $from = $request->query('from');
        $to = $request->query('to');

        return Inertia::render('projects/users/show', $this->recordService->getUserHistory($project, $hash, $period, $from, $to));
    }

    public function showSecurityDetails(Request $request, Team $current_team, Project $project, string $hash): Response
    {
        $period = $request->query('period', '1h');
        $from = $request->query('from');
        $to = $request->query('to');

        return Inertia::render('projects/security/show', $this->recordService->getSecurityHistoryByHash($project, $hash, $period, $from, $to));
    }

    /**
     * Helpers
     */
    protected function renderHistory(Project $project, string $hash, string $component): Response
    {
        $period = request()->query('period', '1h');
        $from = request()->query('from');
        $to = request()->query('to');
        $history = $this->recordService->getHistoryByHash($project, $hash, $period, $from, $to);

        // Find the best record to use for meta (one that has identifying info)
        $first = $history->firstWhere(function ($r) {
            return ! empty($r->payload['name']) ||
                   ! empty($r->payload['job']) ||
                   ! empty($r->payload['command']) ||
                   ! empty($r->payload['route_path']) ||
                   ! empty($r->payload['class']);
        }) ?: $history->first();

        return Inertia::render($component, [
            'hash' => $hash,
            'meta' => $first ? ExceptionTrace::normalize($first->payload) : [],
            'records' => $history,
            'period' => $period,
            'from' => $from,
            'to' => $to,
        ]);
    }

    protected function renderWithStats(string $component, array $data, Project $project, string $period, ?string $from = null, ?string $to = null): Response
    {
        $data['search'] ??= $this->search();

        return Inertia::render($component.'/index', array_merge($data, [
            'stats' => $this->recordService->getQuickStats($project, $period, $from, $to),
            'period' => $period,
            'from' => $from,
            'to' => $to,
        ]));
    }

    protected function resolveTypeFromRoute(string $routeName): string
    {
        $map = ['dashboard' => 'request', 'users' => 'user', 'security' => 'security'];

        return $map[$routeName] ?? Str::singular($routeName);
    }

    /**
     * The raw-list filters a page accepts, read from the query string.
     *
     * @param  list<string>  $keys
     * @return array<string, ?string>
     */
    protected function rawFilters(array $keys): array
    {
        return collect($keys)->mapWithKeys(fn (string $key) => [$key => request()->string($key)->trim()->value() ?: null])->all();
    }

    /**
     * The trimmed search term, or null when empty.
     */
    protected function search(): ?string
    {
        return request()->string('search')->trim()->value() ?: null;
    }

    protected function resolveComponentPath(string $routeName): string
    {
        return $routeName === 'dashboard' ? 'dashboard' : 'projects/'.$routeName.'/index';
    }

    public function showOccurrence(Team $current_team, Project $project, Record $record): Response
    {
        // The record is bound by global id, so verify it belongs to the project
        // in the URL — otherwise any member of any team could read another
        // team's telemetry by guessing record ids.
        abort_if($record->project_id !== $project->id, 404);

        $record->load('issue');
        $relatedRecords = [];
        $parentRecord = null;
        $traceId = $record->trace_id ?? ($record->payload['trace_id'] ?? null);
        $isExecution = in_array($record->type, self::EXECUTION_TYPES, true);

        if ($traceId && $isExecution) {
            $relatedRecords = $project->records()
                ->where('trace_id', $traceId)
                ->where('id', '!=', $record->id)
                ->orderBy('created_at')
                ->limit(200)
                ->get(['id', 'type', 'payload', 'created_at']);
        }

        if ($traceId && ! $isExecution) {
            $parentRecord = $this->executionFor($project, $traceId);
        }

        return Inertia::render('projects/records/show', [
            'record' => $record,
            'relatedRecords' => $relatedRecords,
            'parentRecord' => $parentRecord,
        ]);
    }

    /**
     * Jump from an event to the request, command or job that produced it.
     */
    public function showExecution(Team $current_team, Project $project, Record $record): RedirectResponse
    {
        abort_if($record->project_id !== $project->id, 404);

        $traceId = $record->trace_id ?? ($record->payload['trace_id'] ?? null);
        $target = in_array($record->type, self::EXECUTION_TYPES, true) || ! $traceId
            ? $record
            : ($this->executionFor($project, $traceId) ?? $record);

        return to_route('records.show', [$current_team, $project, $target]);
    }

    protected function executionFor(Project $project, string $traceId): ?Record
    {
        return $project->records()
            ->where('trace_id', $traceId)
            ->whereIn('type', self::EXECUTION_TYPES)
            ->oldest('created_at')
            ->first(['id', 'type', 'payload', 'created_at']);
    }
}
