<?php

namespace App;

class BaseRouter {
	
	/**
	 * Routes to map to controller
	 *   ['method', '/slug', '_function_on_controller']
	 * @var array
	 */
	protected $routes;

	/**
	 * Args to be appended to ArgList
	 *   'argument' => v::numeric()
	 * @return array key value pairs of args
	 */
	protected function args() {
		return [];
	}	


	public function __construct(\Slim\App $app, ArgList $arglist) {
		$reflector = new \ReflectionClass($this);
		foreach ($this->routes as $r) {
			list($method, $route, $fn) = $r;
			$app->{$method}($route, '\\'.$reflector->getNamespaceName().'\Controller:'.$fn);
		}

		foreach ($this->args() as $arg => $val) $arglist->register($arg, $val);
	}

}
