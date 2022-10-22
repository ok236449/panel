<?php

namespace Pterodactyl\Tests\Integration\Api\Client\Server;

use Mockery;
use GuzzleHttp\Psr7\Request;
use Illuminate\Http\Response;
use Mockery\MockInterface;
use Pterodactyl\Models\Server;
use Pterodactyl\Models\Permission;
use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Psr7\Response as GuzzleResponse;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use Pterodactyl\Tests\Integration\Api\Client\ClientApiIntegrationTestCase;

class CommandControllerTest extends ClientApiIntegrationTestCase
{
    /**
     * Test that a validation error is returned if there is no command present in the
     * request.
     */
    public function testValidationErrorIsReturnedIfNoCommandIsPresent()
    {
        [$user, $server] = $this->generateTestAccount();

        $response = $this->actingAs($user)->postJson("/api/client/servers/$server->uuid/command", [
            'command' => '',
        ]);

        $response->assertStatus(Response::HTTP_UNPROCESSABLE_ENTITY);
        $response->assertJsonPath('errors.0.meta.rule', 'required');
    }

    /**
     * Test that a subuser without the required permission receives an error when trying to
     * execute the command.
     */
    public function testSubuserWithoutPermissionReceivesError()
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_WEBSOCKET_CONNECT]);

        $response = $this->actingAs($user)->postJson("/api/client/servers/$server->uuid/command", [
            'command' => 'say Test',
        ]);

        $response->assertStatus(Response::HTTP_FORBIDDEN);
    }

    /**
     * Test that a command can be sent to the server.
     */
    public function testCommandCanSendToServer()
    {
        [$user, $server] = $this->generateTestAccount([Permission::ACTION_CONTROL_CONSOLE]);

        $server = \Mockery::mock($server)->makePartial();
        $server->expects('query->where->firstOrFail')->andReturns($server);

        $this->instance(Server::class, $server);

        $server->expects('send')->with('say Test')->andReturn(new GuzzleResponse());

        $response = $this->actingAs($user)->postJson("/api/client/servers/$server->uuid/command", [
            'command' => 'say Test',
        ]);

        $response->assertStatus(Response::HTTP_NO_CONTENT);
    }

    /**
     * Test that an error is returned when the server is offline that is more specific than the
     * regular daemon connection error.
     */
    public function testErrorIsReturnedWhenServerIsOffline()
    {
        [$user, $server] = $this->generateTestAccount();

        $server = \Mockery::mock($server)->makePartial();
        $server->expects('query->where->firstOrFail')->andReturns($server);
        $server->expects('send')->andThrows(
            new DaemonConnectionException(
                new BadResponseException('', new Request('GET', 'test'), new GuzzleResponse(Response::HTTP_BAD_GATEWAY))
            )
        );

        $this->instance(Server::class, $server);

        $response = $this->actingAs($user)->postJson("/api/client/servers/$server->uuid/command", [
            'command' => 'say Test',
        ]);

        $response->assertStatus(Response::HTTP_BAD_GATEWAY);
        $response->assertJsonPath('errors.0.code', 'HttpException');
        $response->assertJsonPath('errors.0.detail', 'Server must be online in order to send commands.');
    }
}
