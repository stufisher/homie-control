<?php 

namespace App\Modules\Misc;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
	
	protected $routes = [
		['get', '/option', '_get_options'],
		['patch', '/option/{name}', '_patch_options'],

		['get', '/page', '_get_pages'],
		['post', '/page', '_add_page'],
		['patch', '/page/{pageid}', '_patch_page'],
		['delete', '/page/{pageid}', '_delete_page'],
	];

	protected function args() {
		return [
			'latitude' => v::floatVal(),
			'longitude' => v::floatVal(), 
			'timezone' => v::regex('/\w+\/\w+/'),
			'heating_reading_property' => v::intVal(), 
			'heating_control_property' => v::intVal(), 
			'profile_exec_property' => v::intVal(),

			'pageid' => v::intVal(),
			'slug' => v::alnum('_')->noWhitespace(),
			'title' => v::alnum(),
			'template' => v::alnum()->noWhitespace(),
			'display_order' => v::intVal(),
			'config' => false,
		];
	}

}
