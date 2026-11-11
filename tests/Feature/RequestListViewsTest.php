<?php

use App\Enums\TeamRole;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use App\Services\IngestService;

/**
 * @return array{0: User, 1: Team, 2: Project}
 */
function listViewMember(): array
{
    $team = Team::factory()->create();
    $user = User::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $project = Project::factory()->create(['team_id' => $team->id]);

    app(IngestService::class)->ingest($project, [
        ['t' => 'request', '_group' => 'a', 'method' => 'GET', 'url' => 'http://app.test/users/1', 'route_path' => '/users/{user}', 'status_code' => 200],
        ['t' => 'request', '_group' => 'a', 'method' => 'GET', 'url' => 'http://app.test/users/2', 'route_path' => '/users/{user}', 'status_code' => 200],
        ['t' => 'outgoing-request', '_group' => 'h', 'host' => 'api.test', 'method' => 'GET', 'url' => 'https://api.test/v1/items/9', 'status_code' => 200],
    ]);

    return [$user, $team, $project];
}

test('the requests page shows raw requests by default', function () {
    [$user, $team, $project] = listViewMember();

    $this->actingAs($user)
        ->get(route('requests', ['current_team' => $team->slug, 'project' => $project->slug]))
        ->assertInertia(fn ($page) => $page
            ->component('projects/requests/index')
            ->where('view', 'raw')
            ->has('requests.data', 2)
            ->where('requests.data.0.type', 'request')
        );
});

test('the requests page groups by route on request', function () {
    [$user, $team, $project] = listViewMember();

    $this->actingAs($user)
        ->get(route('requests', ['current_team' => $team->slug, 'project' => $project->slug, 'view' => 'routes']))
        ->assertInertia(fn ($page) => $page
            ->where('view', 'routes')
            ->has('requests.data', 1)
            ->where('requests.data.0.path', '/users/{user}')
        );
});

test('the outgoing requests page switches between raw, route and host views', function (string $view, string $field, string $value) {
    [$user, $team, $project] = listViewMember();

    $this->actingAs($user)
        ->get(route('outgoing-requests', ['current_team' => $team->slug, 'project' => $project->slug, 'view' => $view]))
        ->assertInertia(fn ($page) => $page
            ->component('projects/outgoing-requests/index')
            ->where('view', $view)
            ->has('records.data', 1)
            ->where('records.data.0.'.$field, $value)
        );
})->with([
    'raw' => ['raw', 'payload.url', 'https://api.test/v1/items/9'],
    'routes' => ['routes', 'endpoint', 'api.test/v1/items/{id}'],
    'hosts' => ['hosts', 'host', 'api.test'],
]);

test('raw requests filter by status class, exact status and method', function (array $query, int $expected) {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'request', '_group' => 'b', 'method' => 'POST', 'url' => 'http://app.test/orders', 'route_path' => '/orders', 'status_code' => 422],
        ['t' => 'request', '_group' => 'c', 'method' => 'GET', 'url' => 'http://app.test/boom', 'route_path' => '/boom', 'status_code' => 500],
    ]);

    $this->actingAs($user)
        ->get(route('requests', ['current_team' => $team->slug, 'project' => $project->slug, ...$query]))
        ->assertInertia(fn ($page) => $page->has('requests.data', $expected));
})->with([
    '2xx' => [['status' => '2xx'], 2],
    '4xx' => [['status' => '4xx'], 1],
    'exact 500' => [['status' => '500'], 1],
    'method' => [['method' => 'post'], 1],
    'combined' => [['status' => '2xx', 'method' => 'POST'], 0],
    'invalid status is ignored' => [['status' => 'abc'], 4],
]);

test('raw outgoing requests filter by status', function () {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'outgoing-request', '_group' => 'h', 'host' => 'api.test', 'method' => 'GET', 'url' => 'https://api.test/v1/fail', 'status_code' => 503],
    ]);

    $this->actingAs($user)
        ->get(route('outgoing-requests', ['current_team' => $team->slug, 'project' => $project->slug, 'status' => '5xx']))
        ->assertInertia(fn ($page) => $page
            ->has('records.data', 1)
            ->where('records.data.0.payload.status_code', 503)
            ->where('filters.status', '5xx')
        );
});

test('the queries page lists raw queries by default and groups on request', function () {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'query', '_group' => 'q', 'sql' => 'select * from users where id = ?', 'connection' => 'mysql', 'duration' => 10],
        ['t' => 'query', '_group' => 'q', 'sql' => 'select * from users where id = ?', 'connection' => 'mysql', 'duration' => 20],
        ['t' => 'query', '_group' => 'r', 'sql' => 'select 1', 'connection' => 'pgsql', 'duration' => 5],
    ]);

    $route = fn (array $query = []) => route('queries', ['current_team' => $team->slug, 'project' => $project->slug, ...$query]);

    $this->actingAs($user)->get($route())
        ->assertInertia(fn ($page) => $page->where('view', 'raw')->has('queries.data', 3));

    $this->actingAs($user)->get($route(['connection' => 'pgsql']))
        ->assertInertia(fn ($page) => $page->has('queries.data', 1)->where('queries.data.0.payload.sql', 'select 1'));

    $this->actingAs($user)->get($route(['view' => 'grouped']))
        ->assertInertia(fn ($page) => $page->where('view', 'grouped')->has('queries.data', 2));
});

test('logs filter by level', function () {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'log', 'level' => 'error', 'message' => 'it broke'],
        ['t' => 'log', 'level' => 'info', 'message' => 'all good'],
    ]);

    $this->actingAs($user)
        ->get(route('logs', ['current_team' => $team->slug, 'project' => $project->slug, 'level' => 'ERROR']))
        ->assertInertia(fn ($page) => $page
            ->has('records.data', 1)
            ->where('records.data.0.payload.message', 'it broke')
        );
});

test('the exceptions page lists raw occurrences by default and groups on request', function () {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'exception', '_group' => 'e', 'class' => 'RuntimeException', 'message' => 'first'],
        ['t' => 'exception', '_group' => 'e', 'class' => 'RuntimeException', 'message' => 'second'],
    ]);

    $route = fn (array $query = []) => route('exceptions', ['current_team' => $team->slug, 'project' => $project->slug, ...$query]);

    $this->actingAs($user)->get($route())
        ->assertInertia(fn ($page) => $page
            ->where('view', 'raw')
            ->has('exceptions.data', 2)
            ->where('exceptions.data.0.type', 'exception')
        );

    $this->actingAs($user)->get($route(['view' => 'grouped']))
        ->assertInertia(fn ($page) => $page->where('view', 'grouped')->has('exceptions.data', 1));
});

test('the commands page lists raw runs by default and groups on request', function () {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'command', '_group' => 'c', 'command' => 'app:sync', 'exit_code' => 0, 'duration' => 100],
        ['t' => 'command', '_group' => 'c', 'command' => 'app:sync', 'exit_code' => 1, 'duration' => 200],
    ]);

    $route = fn (array $query = []) => route('commands', ['current_team' => $team->slug, 'project' => $project->slug, ...$query]);

    $this->actingAs($user)->get($route())
        ->assertInertia(fn ($page) => $page
            ->where('view', 'raw')
            ->has('commands.data', 2)
            ->where('commands.data.0.type', 'command')
        );

    $this->actingAs($user)->get($route(['view' => 'grouped']))
        ->assertInertia(fn ($page) => $page->where('view', 'grouped')->has('commands.data', 1));
});

test('raw requests search the payload, including values with slashes', function (string $search, int $expected) {
    [$user, $team, $project] = listViewMember();

    $this->actingAs($user)
        ->get(route('requests', ['current_team' => $team->slug, 'project' => $project->slug, 'search' => $search]))
        ->assertInertia(fn ($page) => $page->where('search', $search)->has('requests.data', $expected));
})->with([
    'path with slash' => ['/users/2', 1],
    'case insensitive' => ['APP.TEST', 2],
    'like wildcards are literal' => ['%', 0],
    'no match' => ['missing', 0],
]);

test('grouped lists search their label and sublabel', function () {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'request', '_group' => 'b', 'method' => 'POST', 'url' => 'http://app.test/orders', 'route_path' => '/orders', 'status_code' => 201],
    ]);

    $this->actingAs($user)
        ->get(route('requests', ['current_team' => $team->slug, 'project' => $project->slug, 'view' => 'routes', 'search' => 'order']))
        ->assertInertia(fn ($page) => $page
            ->has('requests.data', 1)
            ->where('requests.total', 1)
            ->where('requests.data.0.path', '/orders')
        );
});

test('exceptions filter by handled state', function (string $handled, string $message) {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'exception', '_group' => 'e', 'class' => 'RuntimeException', 'message' => 'reported', 'handled' => true],
        ['t' => 'exception', '_group' => 'e', 'class' => 'RuntimeException', 'message' => 'crashed', 'handled' => false],
    ]);

    $this->actingAs($user)
        ->get(route('exceptions', ['current_team' => $team->slug, 'project' => $project->slug, 'handled' => $handled]))
        ->assertInertia(fn ($page) => $page
            ->where('filters.handled', $handled)
            ->has('exceptions.data', 1)
            ->where('exceptions.data.0.payload.message', $message)
        );
})->with([
    'handled' => ['yes', 'reported'],
    'unhandled' => ['no', 'crashed'],
]);

test('users search by reported name as well as id', function (string $search) {
    [$user, $team, $project] = listViewMember();

    app(IngestService::class)->ingest($project, [
        ['t' => 'user', 'id' => 123, 'name' => 'Ada Lovelace', 'username' => 'ada@example.com'],
        ['t' => 'request', '_group' => 'u1', 'user' => 123, 'status_code' => 200],
        ['t' => 'request', '_group' => 'u2', 'user' => 456, 'status_code' => 200],
    ]);

    $this->actingAs($user)
        ->get(route('users', ['current_team' => $team->slug, 'project' => $project->slug, 'search' => $search]))
        ->assertInertia(fn ($page) => $page
            ->has('users.data', 1)
            ->where('users.data.0.user_name', 'Ada Lovelace')
        );
})->with(['name' => ['lovelace'], 'email' => ['ada@example'], 'id' => ['123']]);
