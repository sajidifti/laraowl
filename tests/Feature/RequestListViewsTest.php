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
