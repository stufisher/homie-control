<?php

namespace App;

class MySQL {

    private $debug = False;
    
    function __construct($user, $pass, $db, $host = '127.0.0.1') {
        $this->conn = new \mysqli($host, $user, $pass, $db);
        if (mysqli_connect_errno()) {
            $this->error('There was an error connecting to MySQL: ', htmlentities(mysqli_connect_errno()));
        }
    }


    public function _paginate($query, $page, $pagesize, $args=array()) {

    }


    public function paginate($query, $args=array()) {
        // if (sizeof($args)) $args[sizeof($args)-1] = $args[sizeof($args)-1] - $args[sizeof($args)-2];
        return $this->pq("$query LIMIT ?,?", $args);
    }
    
    
    public function pq($query, $args=array()) {
        // Allow for Oracle style :1, :2 out of order
        preg_match_all('/\:(\d+)/', $query, $mat);
        $rearranged_args = array();
        if ($this->debug) print_r(array('old', $args));
        foreach ($mat[1] as $id) {
            $aid = $id-1;
            $val = $args[$aid];
            array_push($rearranged_args, $val);
            unset($args[$aid]);
        }

        foreach ($args as $remain) {
            array_push($rearranged_args, $remain);
        }

        if ($this->debug) print_r(array('rearr', $rearranged_args));
        $args = $rearranged_args;

        // Replace oracle :1 placeholder with ?
        $query = preg_replace('/\:\d+/', '?', $query);


        if ($this->debug) {
            print '<h1 class="debug">MySQL Debug</h1>';
            print $query;
            print_r($args);
        }

        $stmt = $this->conn->prepare($query);
        
        if (!$stmt) {
            $this->error('There was an error with MySQL', $this->conn->error.__LINE__);
        }
        
        if (sizeof($args)) {
            $vtypes = array('NULL' => 'i', 'integer' => 'i', 'double' => 'd', 'string' => 's');
            
            
            $strfs = '';
            foreach ($args as $a) {
                $t = gettype($a);
                $strfs .= $vtypes[$t];
            }
            
            array_unshift($args, $strfs);
            call_user_func_array(array(&$stmt,'bind_param'),$this->refs($args));
        }
        
        if (!$stmt->execute()) {
            $this->error('There was an error with MySQL', $this->conn->error.__LINE__);
        }

        $data = array();
        if (strpos($query, 'SELECT') !== false) {
            $result = $stmt->get_result();
            if ($result) {
                if($result->num_rows > 0) {
                    while($row = $result->fetch_assoc()) {
                        array_push($data, $row);
                    }
                }
            }
        }

        if ($this->debug) print_r(array('rows', sizeof($data)));
        
        $stmt->close();

        return $data;
        
    }

    
    protected function refs($arr) {
        $refs = array();
        foreach ($arr as $key => $value) {
            $refs[$key] = &$arr[$key];
        }
        return $refs;
    }

    
    
    public function id() {
        return $this->conn->insert_id;
    }

    
    public function close() {
        // if (!$this->conn->connect_error) $this->conn->close();
        if ($this->conn) $this->conn->close();
    }


    public function __destroy() {
        $this->close();
    }


    protected function error($title, $msg) {
        header('HTTP/1.1 400 Bad Request');
        print json_encode(array('title' => $title, 'msg' => $msg));
        exit();
    }

    
}
    
?>
