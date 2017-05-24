<?php

namespace App;
use Respect\Validation\Validator as v;

class ArgList {

    /**
     * Array of arguments and validators
     * @var array
     */
    private $_args = [];
    

    /**
     * Default arguments
     * @return array
     */
    private function def() {
        return [
            'page'     => v::intVal(),
            'per_page' => v::intVal(),
            'sort_by'  => v::alnum(),
            'order'    => v::alnum(),
            's'        => v::alnum(),
        ];
    }
    


    public function __construct() {
        $this->_args = $this->def();
    }

    /**
     * Register a new argument and validator onto the stack
     * @param  string argument
     * @param  v::    Respect\Validation validator
     * @return null
     */
    public function register($arg, $validator) {
        $this->_args[$arg] = $validator;
    }


    /**
     * Return full list of arguments and validators
     * @return array
     */
    public function get() {
        return $this->_args;
    }


}