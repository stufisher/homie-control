<?php 

namespace App\Modules\Admin;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
	
	protected $routes = [
		['get', '/admin/device/scan', '_scan_devices'],
		['get', '/admin/device/info', '_device_info'],
		['get', '/admin/device/config', '_device_configure'],
	];

	protected function args() {
		return [
			'ssid' => v::alnum('-')->noWhitespace(),
			'name' => v::alnum('-'),
		];
	}

}
