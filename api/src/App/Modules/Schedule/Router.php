<?php 

namespace App\Modules\Schedule;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
	
	protected $routes = [
		['get', '/schedule/component', '_get_schedule_components'],
		['post', '/schedule/component', '_add_schedule_component'],
		['put', '/schedule/component/{schedulecomponentid}', '_put_schedule_component'],
		['delete', '/schedule/component/{schedulecomponentid}', '_delete_schedule_component'],

		['get', '/schedule', '_get_schedules'],
		['post', '/schedule', '_add_schedule'],
		['patch', '/schedule/{scheduleid}', '_patch_schedule'],
		['delete', '/schedule/{scheduleid}', '_delete_schedule'],
	];

	protected function args() {
		return [
			'propertyid' => v::intVal(),
			'scheduleid' => v::intVal(),
			'schedulecomponentid' => v::intVal(),
			'start' => v::regex('/\d+\/\d+/'),
			'end' => v::regex('/\d+\/\d+/'),
			'requiredevice' => v::intVal(),
			'startt' => v::regex('/\d+:\d+/'),
			'endt' => v::regex('/\d+:\d+/'),
			'day' => v::intVal(),
			'enabled' => v::intVal(),
			'invert' => v::intVal(),
		];
	}

}
