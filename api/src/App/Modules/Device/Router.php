<?php 

namespace App\Modules\Device;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
	
	protected $routes = [
		['get', '/device', '_get_devices'],
		['post', '/device', '_add_device'],
		['patch', '/device/{deviceid}', '_patch_device'],
		['delete', '/device/{deviceid}', '_delete_device'],
		
	];

	protected function args() {
		return [
			'deviceid' => v::intVal(),
			'macaddress' => v::regex('/^\w\w\:\w\w\:\w\w\:\w\w\:\w\w\:\w\w$/'),
			'active' => v::intVal(),
		];
	}

}
