<?php

namespace App;

use Respect\Validation\Exceptions\NestedValidationException;

class Arg {

    private $_key;
    private $_empty = False;
    private $_valid = 'Unset';
    private $_raw;
    private $_parsed;

    public function __construct($key) {
        $this->_key = $key;
    }


    /**
     * Dry setter/getters
     * @param  string  method name
     * @param  array   arguments
     * @return mixed
     */
    public function __call($method, $args) {
        if (strpos($method, 'get') === 0) {
            $key = strtolower(str_replace('get', '', $method));
            $var = '_'.$key;
            if (array_key_exists($var, get_object_vars($this)))
                return $this->{$var};
        }

        if (strpos($method, 'set') === 0) {
            $key = strtolower(str_replace('set', '', $method));
            $var = '_'.$key;
            if (array_key_exists($var, get_object_vars($this)))
                $this->{$var} = $args[0];

            return $this;
        }
    }

}

/**
 * 
 */
class ArgParser {
    private $_purifier;
    private $_validators;


    /**
     * Parsed argument list and values
     * @var array string => Arg
     */
    private $_args = [];



    /**
     * @param HTMLPurifier HTMLPurifier object
     * @param BaseArgList  BaseArgList object
     */
    public function __construct($purifier, ArgList $validators) {
        $this->_purifier = $purifier;
        $this->_validators = $validators;
    }


    public function __invoke($request, $response, $next) {
        $params = $request->getParams();

        // Cryptic - get route parameters
        $route_params = $request->getAttribute('routeInfo')[2];
        if ($route_params) $params = array_merge($params, $route_params);

        // Array of arguments
        if (sizeof($params) && !$this->is_assoc($params)) {
            $pa = array();
            foreach ($params as $element) {
                array_push($pa, $this->parseRequest($element));
            }

            $this->_args['collection'] = $pa;

        // Single dict of arguments
        } $this->_args = $this->parseRequest($params);

        // print_r(['args', $args]);

        return $next($request, $response);
    }


    /**
     * Parse a dict of key value pairs into parsed values with
     *   valid, empty, parsed parameters
     * @param  array  dict of key value parameters
     * @return array  array Arg objects
     */
    private function parseRequest($params) {
        $args = array();

        foreach ($this->_validators->get() as $key => $validator) {
            // Array of values
            if (array_key_exists($key, $params)) {
                $raw = $params[$key];
                $p = (new Arg($key))->setRaw($raw);

                if (is_array($raw)) {
                    $tmp = array();
                    $valid = null;
                    foreach ($request[$k] as $val) {
                        if ($raw === '') {
                            array_push($tmp, $raw);

                        } else if (!$validator) {
                            array_push($tmp, $this->_purifier->purify($raw));
                            
                        } else {
                            $msg = $this->validate($raw, $validator);
                            if ($msg) $valid = $msg;
                            else array_push($tmp, $raw);
                        }
                    }

                    $p->setParsed($tmp);
                    $p->setValid($valid);
                    
                // Single value
                } else {
                    if ($raw === '') {
                        $p->setEmpty(true);

                    } else if (!$validator) {
                        $p->setParsed($this->_purifier->purify($raw));
                        $p->setValid(null);

                    } else {
                        $msg = $this->validate($raw, $validator);
                        $p->setValid($msg);
                        if (empty($msg)) $p->setParsed($raw);
                    }
                }

                $args[$key] = $p;
            }
        }

        // var_dump($args);
        return $args;
    }



    /**
     * Validate $raw against its $validator
     * @param  string    raw_value
     * @param  validator Respect\Validation\Validator
     * @return string    validator error message
     */
    private function validate($raw, $validator) {
        try {
            $validator->assert($raw);
        } catch (NestedValidationException $exception) {
            return $exception->getMessages();
        }
    }



    /**
     * Does valid key exist? 
     * @param  string  key
     * @return boolean keyExists
     */
    public function has($key, $allowEmpty = false) {
        if (array_key_exists($key, $this->_args)) {
            $p = $this->_args[$key];
            // print_r(['p', $p]);
            return empty($p->getValid()) || ($allowEmpty && $p->getEmpty());
        }

        return false;
    }


    /**
     * Return parsed value for key
     * @param  string key
     * @param  mixed  default value
     * @return mixed  value
     */
    public function value($key, $default = null) {
        if (array_key_exists($key, $this->_args)) {
            $p = $this->_args[$key];
            if (empty($p->getValid())) return $p->getParsed();
            else return $default;

        } else return $default;
    }


    /**
     * Is key empty?
     * @param  string  key
     * @return boolean isEmpty
     */
    public function isEmpty($key) {
        if (array_key_exists($key, $this->_args)) {
            $p = $this->_args[$key];
            return $p->getEmpty();
        }
    }


    /**
     * Is key valid?
     * @param  string key
     * @return null   if valid
     *         string message if invalid
     */
    public function valid($key) {
        if (array_key_exists($key, $this->_args)) {
            $p = $this->_args[$key];
            return $p->getValid();
        }
    }



    /**
     * Helper is $array an array or dict
     * @param  array   array
     * @return boolean isArray
     */
    private function is_assoc(array $array) {
        $keys = array_keys($array);
        return array_keys($keys) !== $keys;
    }

}
