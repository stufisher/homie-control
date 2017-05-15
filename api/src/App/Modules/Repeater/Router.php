<?php 

namespace App\Modules\Repeater;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
	
	protected $routes = [
		['get', '/repeater', '_get_repeater'],
		['post', '/repeater', '_add_repeater'],
		['patch', '/repeater/{repeatermapid}', '_patch_repeater'],
		['delete', '/repeater/{repeatermapid}', '_delete_repeater'],
		
	];

	protected function args() {
		return [
			'repeatermapid' => v::intVal(),
			'repeaterpropertyid' => v::intVal(),
			'round' => v::intVal(),
		];
	}

}
