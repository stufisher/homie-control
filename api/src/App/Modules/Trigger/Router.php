<?php 

namespace App\Modules\Trigger;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
	
	protected $routes = [
		['get', '/trigger/property', '_get_ptriggers'],
		['post', '/trigger/property', '_add_ptrigger'],
		['patch', '/trigger/property/{propertytriggerid}', '_patch_ptrigger'],
		['delete', '/trigger/property/{propertytriggerid}', '_delete_ptrigger'],


		['get', '/trigger/sun', '_get_striggers'],
		['post', '/trigger/sun', '_add_strigger'],
		['patch', '/trigger/sun/{suntriggerid}', '_patch_strigger'],
		['delete', '/trigger/sun/{suntriggerid}', '_delete_strigger'],


		['get', '/trigger/device', '_get_dtriggers'],
		['post', '/trigger/device', '_add_dtrigger'],
		['patch', '/trigger/device/{devicetriggerid}', '_patch_dtrigger'],
		['delete', '/trigger/device/{devicetriggerid}', '_delete_dtrigger'],		
	];

	protected function args() {
		return [
			'propertytriggerid' => v::intVal(),
			'comparator' => v::in(['==', '>=', '<=', '!=', '<', '>']),
			'schedulestatus' => v::intVal(),

			'suntriggerid' => v::intVal(),
			'sunset' => v::intVal(),

			'devicetriggerid' => v::intVal(),
			'connected' => v::intVal(),
			'requirelast' => v::intVal(),
			'requiresunset' => v::intVal(),
			'requiredevice' => v::intVal(),
			'requirenodevice' => v::intVal(),

			'email' => v::intVal(),
			'push' => v::intVal(),
			'delay' => v::intVal(),
		];
	}

}
