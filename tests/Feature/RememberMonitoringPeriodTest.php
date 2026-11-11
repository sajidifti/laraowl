<?php

use App\Enums\TeamRole;
use App\Models\Project;
use App\Models\Record;
use App\Models\Team;
use App\Models\User;
use App\Services\IngestService;

/**
 * @return array{0: User, 1: Team, 2: Project}
 */
function periodMember(): array
{
    $team = Team::factory()->create();
    $user = User::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $project = Project::factory()->create(['team_id' => $team->id]);

    return [$user, $team, $project];
}

test('a page without a period keeps the last selected one', function () {
    [$user, $team, $project] = periodMember();
    app(IngestService::class)->ingest($project, [['t' => 'request', 'status_code' => 200, 'route_path' => '/']]);
    $record = Record::where('project_id', $project->id)->firstOrFail();
    $args = ['current_team' => $team->slug, 'project' => $project->slug];

    $this->actingAs($user)->get(route('requests', [...$args, 'period' => '7d']))->assertOk();

    $this->get(route('records.show', [...$args, 'record' => $record->id]))
        ->assertInertia(fn ($page) => $page->where('period', '7d'));
});

test('a custom window is remembered with its bounds', function () {
    [$user, $team, $project] = periodMember();
    $args = ['current_team' => $team->slug, 'project' => $project->slug];

    $this->actingAs($user)->get(route('requests', [...$args, 'period' => 'custom', 'from' => '2026-11-01', 'to' => '2026-11-02']))->assertOk();

    $this->get(route('logs', $args))
        ->assertInertia(fn ($page) => $page->where('period', 'custom')->where('from', '2026-11-01')->where('to', '2026-11-02'));
});

test('an explicit period wins and unknown periods are not remembered', function () {
    [$user, $team, $project] = periodMember();
    $args = ['current_team' => $team->slug, 'project' => $project->slug];

    $this->actingAs($user)->get(route('requests', [...$args, 'period' => '30d']))->assertOk();
    $this->get(route('requests', [...$args, 'period' => 'bogus']))->assertOk();

    $this->get(route('logs', [...$args, 'period' => '24h']))
        ->assertInertia(fn ($page) => $page->where('period', '24h'));

    $this->get(route('logs', $args))
        ->assertInertia(fn ($page) => $page->where('period', '24h'));
});

test('without any selection the default window applies', function () {
    [$user, $team, $project] = periodMember();

    $this->actingAs($user)
        ->get(route('logs', ['current_team' => $team->slug, 'project' => $project->slug]))
        ->assertInertia(fn ($page) => $page->where('period', '1h'));
});
