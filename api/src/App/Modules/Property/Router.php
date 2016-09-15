<?php 

namespace App\Modules\Property;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
    
    protected $routes = [
        ['get', '/property/type', '_get_ptypes'],

        ['get', '/property[/{propertyid:\d+}]', '_get_properties'],
        ['post', '/property', '_add_property'],
        ['patch', '/property/{propertyid}', '_patch_property'],
        ['delete', '/property/{propertyid}', '_delete_property'],
        

        ['get', '/history', '_get_history'],
        // ['get', '/usage', '_get_usage'],
    ];

    protected function args() {
        return [
            'propertytypeid' => v::intVal(),

            'devicestring' => v::alnum()->noWhitespace(),
            'nodestring' => v::alnum()->noWhitespace(),
            'propertystring' => v::alnum()->noWhitespace(),

            'friendlyname' => v::alnum(),
            'option' => v::alnum('_'),

            'type' => v::alnum(),
        ];
    }

}
