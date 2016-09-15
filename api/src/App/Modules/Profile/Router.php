<?php 

namespace App\Modules\Profile;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
	
	protected $routes = [
		['get', '/profile', '_get_profiles'],
		['post', '/profile', '_add_profile'],
		['patch', '/profile/{propertyprofileid}', '_patch_profile'],
		['delete', '/profile/{propertyprofileid}', '_delete_profile'],
		

		['get', '/profile/component', '_get_profile_components'],
		['post', '/profile/component', '_add_profile_component'],
		['delete', '/profile/component/{propertyprofilecomponentid}', '_delete_profile_component'],
	];

	protected function args() {
		return [
			'propertyid' => v::intVal(),
			'propertyprofileid' => v::intVal(),
			'propertyprofilecomponentid' => v::intVal(),

			'propertygroupid' => v::intVal(),
			'propertysubgroupid' => v::intVal(),

			'name' => v::alnum(),
			'value' => v::floatVal(),
		];
	}

}
