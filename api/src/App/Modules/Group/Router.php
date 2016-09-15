<?php 

namespace App\Modules\Group;
use App\BaseRouter as BaseRouter;
use Respect\Validation\Validator as v;

class Router extends BaseRouter {
    
    protected $routes = [
        ['get', '/property/group/component', '_get_pgcs'],
        ['post', '/property/group/component', '_add_pgc'],
        ['delete', '/property/group/component/{propertygroupcomponentid}', '_delete_pgc'],

        ['get', '/property/group', '_get_pgs'],
        ['post', '/property/group', '_add_pg'],
        ['patch', '/property/group/{propertygroupid}', '_patch_pg'],
        ['delete', '/property/group/{propertygroupid}', '_delete_pg'],



        ['get', '/property/subgroup/component', '_get_psgcs'],
        ['post', '/property/subgroup/component', '_add_psgc'],
        ['delete', '/property/subgroup/component/{propertysubgroupcomponentid}', '_delete_psgc'],

        ['get', '/property/subgroup', '_get_psgs'],
        ['post', '/property/subgroup', '_add_psg'],
        ['patch', '/property/subgroup/{propertysubgroupid}', '_patch_psg'],
        ['delete', '/property/subgroup/{propertysubgroupid}', '_delete_psg'],
    ];

    protected function args() {
        return [
            'propertygroupid' => v::intVal(),
            'propertygroupcomponentid' => v::intVal(),

            'propertysubgroupid' => v::intVal(),
            'propertysubgroupcomponentid' => v::intVal(),

            'history' => v::intVal(),
        ];
    }

}
